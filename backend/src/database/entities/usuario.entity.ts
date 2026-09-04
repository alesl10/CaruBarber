import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

export type RolUsuario = 'admin' | 'cliente';

@Entity('usuarios')
export class Usuario {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nombre: string;

  @Column({ unique: true })
  email: string;

  /**
   * Hash bcrypt, nunca la contraseña en texto plano. Null para clientes creados al
   * reservar sin cuenta (no tienen login; se identifican solo por email).
   */
  @Column({ type: 'varchar', nullable: true })
  password: string | null;

  @Column({ default: 'cliente' })
  rol: RolUsuario;

  @Column({ type: 'varchar', nullable: true })
  telefono: string | null;
}
