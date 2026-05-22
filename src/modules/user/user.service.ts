import { HttpStatus, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import bcrypt from 'bcryptjs';
import { User } from 'prisma/client';
import { PrismaService } from 'src/services/prisma';

import { ExceptionHandler, ObjectManipulator, PaginationDto, PaginationResponse } from '../common';
import { USER_FIELDS_TO_OMIT } from './config';
import { CreateUserDto, UpdateUserDto } from './dto';
import { UserFindOneParams, UserModel } from './interfaces';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto): Promise<UserModel> {
    try {
      const hashedPassword = bcrypt.hashSync(createUserDto.password, bcrypt.genSaltSync());
      const newUser = await this.prisma.user.create({
        data: { ...createUserDto, password: hashedPassword },
        omit: USER_FIELDS_TO_OMIT,
      });

      return newUser;
    } catch (error) {
      ExceptionHandler.handle({
        error,
        context: 'UserService.create',
        message: 'An error occurred while creating the user.',
      });
    }
  }

  async findAll(pagination: PaginationDto): Promise<PaginationResponse<UserModel>> {
    try {
      const { page, limit } = pagination;

      const [data, total] = await this.prisma.$transaction([
        this.prisma.user.findMany({
          take: limit,
          skip: (page - 1) * limit,
          omit: USER_FIELDS_TO_OMIT,
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.user.count(),
      ]);

      const lastPage = Math.ceil(total / limit);

      return { meta: { total, page, lastPage }, data };
    } catch (error) {
      ExceptionHandler.handle({
        error,
        context: 'UserService.findAll',
        message: 'An error occurred while retrieving users.',
      });
    }
  }

  async findBy({ where, withPassword = false }: UserFindOneParams): Promise<UserModel | User> {
    try {
      const user = await this.prisma.user.findUnique({ where, omit: withPassword ? {} : USER_FIELDS_TO_OMIT });

      if (!user)
        throw new NotFoundException({
          status: 404,
          message: `User with ${ObjectManipulator.toString(where)} not found.`,
        });

      return user;
    } catch (error) {
      ExceptionHandler.handle({
        error,
        context: `UserService.findBy(${ObjectManipulator.toString({ ...where, withPassword })})`,
        message: 'An error occurred while retrieving the user.',
      });
    }
  }

  async validatePassword(username: string, password: string): Promise<UserModel> {
    try {
      const user = await this.prisma.user.findUnique({ where: { username } });

      if (!user)
        throw new NotFoundException({
          status: HttpStatus.NOT_FOUND,
          message: `User with username ${username} not found.`,
        });

      const isValidPassword = bcrypt.compareSync(password, user.password);

      if (!isValidPassword)
        throw new UnauthorizedException({
          status: HttpStatus.UNAUTHORIZED,
          message: `Invalid credentials.`,
          internal: `Error when validating password for user with username ${username}.`,
        });

      return ObjectManipulator.exclude<User>(user, ['password']) as UserModel;
    } catch (error) {
      ExceptionHandler.handle({
        error,
        context: `UserService.validatePassword(${username})`,
        message: 'An error occurred while retrieving the user.',
      });
    }
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<UserModel> {
    try {
      const user = await this.findBy({ where: { id } });

      const updatedUser = await this.prisma.user.update({
        where: { id: user.id },
        data: updateUserDto,
        omit: USER_FIELDS_TO_OMIT,
      });

      return updatedUser;
    } catch (error) {
      ExceptionHandler.handle({
        error,
        context: `UserService.update(${id})`,
        message: 'An error occurred while updating the user.',
      });
    }
  }

  async remove(id: string): Promise<{ message: string }> {
    try {
      const user = await this.findBy({ where: { id } });

      await this.prisma.user.update({ where: { id: user.id }, data: { deletedAt: new Date() } });

      return { message: `User ${user.username} with id ${id} has been removed.` };
    } catch (error) {
      ExceptionHandler.handle({
        error,
        context: `UserService.remove(${id})`,
        message: 'An error occurred while removing the user.',
      });
    }
  }

  async restore(id: string): Promise<{ message: string }> {
    try {
      const user = await this.findBy({ where: { id } });

      await this.prisma.user.update({ where: { id: user.id }, data: { deletedAt: null } });

      return { message: `User ${user.username} with id ${id} has been restored.` };
    } catch (error) {
      ExceptionHandler.handle({
        error,
        context: `UserService.restore(${id})`,
        message: 'An error occurred while restoring the user.',
      });
    }
  }
}
