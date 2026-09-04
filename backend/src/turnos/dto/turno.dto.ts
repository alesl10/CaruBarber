import {
  IsInt,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateTurnoDto {
  @IsInt()
  @Min(1)
  servicioId: number;

  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'fecha debe ser YYYY-MM-DD' })
  fecha: string;

  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'horaInicio debe ser HH:MM' })
  horaInicio: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  nota?: string;
}

export class CambiarEstadoDto {
  @IsOptional()
  @IsString()
  @MaxLength(300)
  motivo?: string;
}
