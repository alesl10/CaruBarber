import { Column, Entity, PrimaryColumn } from 'typeorm';

/**
 * Configuración global de la agenda. Fila única con id = 1 (singleton).
 */
@Entity('configuracion_agenda')
export class ConfiguracionAgenda {
  @PrimaryColumn()
  id: number;

  /** Paso en minutos de la grilla de horarios ofrecidos al reservar. */
  @Column({ default: 15 })
  intervaloTurnos: number;

  /** Antelación mínima (en horas) con la que un cliente puede reservar. 0 = sin límite. */
  @Column({ default: 0 })
  anticipacionMinimaHoras: number;
}
