import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('servicios')
export class Servicio {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nombre: string;

  @Column()
  duracionMinutos: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  precio: number;

  @Column({ default: true })
  activo: boolean;
}
