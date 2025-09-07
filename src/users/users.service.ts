// users/users.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) { }

  async findAll(): Promise<User[]> {
    return this.userModel.find().exec();
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email }).exec();
  }

  async findById(id: string): Promise<UserDocument> {
    const user = await this.userModel.findById(id).exec();
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async createUser(fullName: string, email: string, password: string): Promise<UserDocument> {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = new this.userModel({ fullName, email, password: passwordHash,});
    return newUser.save();
  }

  async updateRoles(id: string, roles: string[]): Promise<UserDocument> {
    const user = await this.userModel.findByIdAndUpdate(
      id,
      { roles },
      { new: true }
    );
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateStatus(userId: string, isActive: boolean): Promise<User> {
    const user = await this.userModel.findByIdAndUpdate(
      userId,
      { isActive },
      { new: true }
    );
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateLoyaltyPoints(userId: string, points: number): Promise<User> {
    const user = await this.userModel.findByIdAndUpdate(
      userId,
      { $inc: { loyaltyPoints: points } },
      { new: true }
    );
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async deleteUser(userId: string): Promise<void> {
    const result = await this.userModel.findByIdAndDelete(userId);
    if (!result) throw new NotFoundException('User not found');
  }
}
