import { inject, injectable } from "tsyringe";
import { IUserRepository } from "../repositories/IUserRepository";
import { hash, compare } from "bcrypt";
import { sign } from "jsonwebtoken";
import { UserDto } from "../dto/UserDto";
import { LoginDto } from "../dto/LoginDto";
import { AppError } from "../errors/AppError";

@injectable()
export class UserService {
  constructor(
    @inject("UserRepository")
    private userRepository: IUserRepository
  ) {}

  async create({ name, email, password }: UserDto) {
    const userAlreadyExists = await this.userRepository.findByEmail(email);
    if (userAlreadyExists) {
      throw new AppError("User already exists", 400);
    }
    const hashPassword = await hash(password, parseInt(process.env.HASH_SALT));
    return await this.userRepository.create({
      name,
      email,
      password: hashPassword,
    });
  }

  async find() {
    return await this.userRepository.find();
  }

  async login({ email, password }: LoginDto) {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new AppError("User not exists", 400);
    }
    if (await compare(password, user.hashPassword)) {
      return sign({}, process.env.HASH_TOKEN, {
        subject: user.id,
        expiresIn: "1d",
      });
    } else {
      throw new AppError("User not exists", 400);
    }
  }
}
