import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

/**
 * Bloqueo puntual de la agenda (feriado, vacaciones, franco).
 * Si horaInicio/horaFin son null, se bloquea el día completo.
 */
@Entity('bloqueos_agenda')
export class BloqueoAgenda {
  @PrimaryGeneratedColumn()
  id: number;

  /** 'YYYY-MM-DD' */
  @Column()
  fecha: string;

  /** 'HH:MM' o null (día completo). */
  @Column({ type: 'varchar', nullable: true })
  horaInicio: string | null;

  /** 'HH:MM' o null (día completo). */
  @Column({ type: 'varchar', nullable: true })
  horaFin: string | null;

  @Column({ default: '' })
  motivo: string;

  @CreateDateColumn()
  createdAt: Date;
}
