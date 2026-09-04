import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;
const FECHA = /^\d{4}-\d{2}-\d{2}$/;

export class UpdateHorarioDto {
  @IsBoolean()
  activo: boolean;

  @Matches(HHMM, { message: 'horaApertura debe ser HH:MM' })
  horaApertura: string;

  @Matches(HHMM, { message: 'horaCierre debe ser HH:MM' })
  horaCierre: string;

  @IsOptional()
  @ValidateIf((o) => o.descansoInicio !== null)
  @Matches(HHMM, { message: 'descansoInicio debe ser HH:MM o null' })
  descansoInicio?: string | null;

  @IsOptional()
  @ValidateIf((o) => o.descansoFin !== null)
  @Matches(HHMM, { message: 'descansoFin debe ser HH:MM o null' })
  descansoFin?: string | null;
}

export class CreateBloqueoDto {
  @Matches(FECHA, { message: 'fecha debe ser YYYY-MM-DD' })
  fecha: string;

  @IsOptional()
  @ValidateIf((o) => o.horaInicio !== null && o.horaInicio !== undefined)
  @Matches(HHMM, { message: 'horaInicio debe ser HH:MM' })
  horaInicio?: string | null;

  @IsOptional()
  @ValidateIf((o) => o.horaFin !== null && o.horaFin !== undefined)
  @Matches(HHMM, { message: 'horaFin debe ser HH:MM' })
  horaFin?: string | null;

  @IsOptional()
  @IsString()
  motivo?: string;
}

export class UpdateConfiguracionDto {
  @IsOptional()
  @IsInt()
  @Min(5)
  @Max(120)
  intervaloTurnos?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(168)
  anticipacionMinimaHoras?: number;
}
