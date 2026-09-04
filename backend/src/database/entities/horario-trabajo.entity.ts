import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

/**
 * Horario de atención para un día de la semana. Una fila por día (diaSemana 0..6).
 */
@Entity('horarios_trabajo')
export class HorarioTrabajo {
  @PrimaryGeneratedColumn()
  id: number;

  /** 0 = domingo, 1 = lunes, ... 6 = sábado */
  @Column({ unique: true })
  diaSemana: number;

  /** Si es false, no se atiende ese día. */
  @Column({ default: true })
  activo: boolean;

  /** 'HH:MM' */
  @Column({ default: '09:00' })
  horaApertura: string;

  /** 'HH:MM' */
  @Column({ default: '19:00' })
  horaCierre: string;

  /** 'HH:MM' o null si no hay descanso. */
  @Column({ type: 'varchar', nullable: true })
  descansoInicio: string | null;

  /** 'HH:MM' o null si no hay descanso. */
  @Column({ type: 'varchar', nullable: true })
  descansoFin: string | null;
}
