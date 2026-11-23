import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { ReportResponseDto } from './dto/report-response.dto';

@ApiTags('Reports')
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar relatórios de indicações' })
  @ApiResponse({ status: 200, type: [ReportResponseDto] })
  findAll() {
    return this.reportsService.findAll();
  }
}
