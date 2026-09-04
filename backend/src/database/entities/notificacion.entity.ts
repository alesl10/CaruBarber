import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

export type TipoNotificacion =
  | 'turno_reservado'
  | 'turno_confirmado'
  | 'turno_cancelado';

@Entity('notificaciones')
export class Notificacion {
  @PrimaryGeneratedColumn()
  id: number;

  /** Rol al que va dirigida ('admin' para el peluquero, 'cliente' para el que reservó). */
  @Column()
  destinatarioRol: string;

  /** Id del usuario destinatario cuando aplica (notificaciones al cliente). */
  @Column({ type: 'int', nullable: true })
  destinatarioId: number | null;

  @Column()
  tipo: TipoNotificacion;

  @Column()
  turnoId: number;

  @Column()
  mensaje: string;

  @Column({ default: false })
  leida: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
