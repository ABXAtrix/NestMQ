import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { RedisService } from '../../common/redis/redis.service';
import { RabbitMQService } from '../../common/rabbitmq/rabbitmq.service';
import { CustomerRepository } from './customer.repository';
import { CreateCustomerDto } from './dto/create-customer.dto';
import {
  CustomerDocument,
  INDICATION_EXCHANGE,
  INDICATION_ROUTING_KEY,
  IndicationEvent,
} from './schemas/customer.schema';

const key = (id: string) => `customer:${id}`;

interface MongoDuplicateKeyError {
  code: number;
}

function isDuplicateKeyError(error: unknown): error is MongoDuplicateKeyError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as MongoDuplicateKeyError).code === 11000
  );
}

@Injectable()
export class CustomerService {
  private readonly log = new Logger(CustomerService.name);

  constructor(
    private readonly customerRepository: CustomerRepository,
    private readonly redisService: RedisService,
    private readonly rabbitMQService: RabbitMQService,
  ) {}

  async create(dto: CreateCustomerDto) {
    if (dto.parent_customer_id) {
      await this.assertParentExists(dto.parent_customer_id);
    }

    let doc: CustomerDocument;
    try {
      doc = await this.customerRepository.create(dto);
    } catch (error: unknown) {
      if (isDuplicateKeyError(error)) {
        throw new ConflictException('email already exists');
      }
      throw error;
    }

    const customer = doc.toJSON();
    await this.cacheCustomer(customer);

    if (dto.parent_customer_id) {
      const event: IndicationEvent = {
        customer_id: String(doc._id),
        parent_customer_id: dto.parent_customer_id,
      };
      await this.rabbitMQService.publish(
        INDICATION_EXCHANGE,
        INDICATION_ROUTING_KEY,
        event,
      );
    }

    this.log.log(
      JSON.stringify({
        event: 'create_customer',
        id: String(doc._id),
        parent: dto.parent_customer_id ?? null,
      }),
    );

    return customer;
  }

  private async assertParentExists(id: string) {
    if (await this.redisService.exists(key(id))) return;
    const parent = await this.customerRepository.findById(id);
    if (!parent) throw new BadRequestException('parent customer not found');
    await this.cacheCustomer(parent);
  }

  private async cacheCustomer(c: { _id?: unknown }) {
    await this.redisService.set(key(String(c._id)), JSON.stringify(c));
  }
}
