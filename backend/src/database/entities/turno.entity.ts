import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

export type EstadoTurno = 'pendiente' | 'confirmado' | 'realizado' | 'cancelado';

@Entity('turnos')
export class Turno {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  clienteId: number;

  @Column()
  servicioId: number;

  /** 'YYYY-MM-DD' */
  @Column()
  fecha: string;

  /** 'HH:MM' */
  @Column()
  horaInicio: string;

  /** 'HH:MM' */
  @Column()
  horaFin: string;

  @Column({ default: 'pendiente' })
  estado: EstadoTurno;

  @Column({ type: 'varchar', nullable: true })
  notaCliente: string | null;

  @CreateDateColumn()
  createdAt: Date;
}
