import {
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  MinLength,
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

  /** Datos de contacto: se reserva sin cuenta, identificando al cliente por su email. */
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  nombre: string;

  @IsEmail()
  email: string;

  @Matches(/^[0-9()+\s-]{6,20}$/, { message: 'Teléfono inválido' })
  telefono: string;
}

export class CambiarEstadoDto {
  @IsOptional()
  @IsString()
  @MaxLength(300)
  motivo?: string;
}
