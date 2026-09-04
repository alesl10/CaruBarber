import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
import { Usuario } from '../database/entities/usuario.entity';
import { LoginDto, RegisterDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
    private readonly jwt: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existe = await this.usuarioRepository.findOne({ where: { email: dto.email } });
    if (existe) {
      throw new ConflictException('Ya existe una cuenta con ese email');
    }

    const user = await this.usuarioRepository.save({
      nombre: dto.nombre,
      email: dto.email,
      password: await bcrypt.hash(dto.password, 10),
      telefono: dto.telefono ?? null,
      rol: 'cliente',
    });

    return this.sesion(user);
  }

  async login(dto: LoginDto) {
    const user = await this.usuarioRepository.findOne({ where: { email: dto.email } });
    if (!user || !(await bcrypt.compare(dto.password, user.password))) {
      throw new UnauthorizedException('Credenciales inválidas');
    }
    return this.sesion(user);
  }

  async perfil(id: number) {
    const user = await this.usuarioRepository.findOne({ where: { id } });
    if (!user) {
      throw new UnauthorizedException('Usuario inexistente');
    }
    return this.publico(user);
  }

  private sesion(user: Usuario) {
    const payload = {
      sub: user.id,
      email: user.email,
      nombre: user.nombre,
      rol: user.rol,
    };
    return {
      token: this.jwt.sign(payload),
      user: this.publico(user),
    };
  }

  private publico(user: Usuario) {
    return {
      id: user.id,
      nombre: user.nombre,
      email: user.email,
      rol: user.rol,
      telefono: user.telefono,
    };
  }
}
