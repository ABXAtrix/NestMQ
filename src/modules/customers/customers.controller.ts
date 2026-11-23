import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { CustomerService } from './customer.service';

@ApiTags('customers')
@Controller('customers')
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @Post()
  @ApiOperation({ summary: 'Criar novo cliente' })
  @ApiResponse({ status: 201, description: 'Cliente criado com sucesso.' })
  @ApiResponse({ status: 400, description: 'Requisição inválida.' })
  @ApiResponse({ status: 409, description: 'E-mail já cadastrado.' })
  create(@Body() dto: CreateCustomerDto) {
    return this.customerService.create(dto);
  }
}

export { CustomerController as CustomersController };
