import { IsInt, IsNumber, IsOptional, IsString, Min, MinLength } from 'class-validator';

export class CreateServicioDto {
  @IsString()
  @MinLength(2)
  nombre: string;

  @IsInt()
  @Min(5)
  duracionMinutos: number;

  @IsNumber()
  @Min(0)
  precio: number;
}

export class UpdateServicioDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  nombre?: string;

  @IsOptional()
  @IsInt()
  @Min(5)
  duracionMinutos?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  precio?: number;
}
