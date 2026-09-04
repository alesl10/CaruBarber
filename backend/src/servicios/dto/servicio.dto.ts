import { IsInt, IsNumber, IsOptional, IsString, Matches, Min, MinLength } from 'class-validator';

/** URL absoluta (http/https) o ruta relativa a `frontend/public` (p. ej. `/barba.jpg`). */
const IMAGEN_URL_REGEX = /^(https?:\/\/\S+|\/\S+)$/;
const IMAGEN_URL_MENSAJE = 'imagenUrl debe ser una URL (http/https) o una ruta que empiece con /';

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

  @IsOptional()
  @Matches(IMAGEN_URL_REGEX, { message: IMAGEN_URL_MENSAJE })
  imagenUrl?: string;
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

  @IsOptional()
  @Matches(IMAGEN_URL_REGEX, { message: IMAGEN_URL_MENSAJE })
  imagenUrl?: string | null;
}
