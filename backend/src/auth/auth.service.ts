import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { User, UserDocument } from '../schemas/user.schema';
import { RegisterUserDto, LoginUserDto, AdminLoginDto } from '../dto/auth.dto';

@Injectable()
export class AuthService {
  private readonly jwtSecret = process.env.JWT_SECRET || 'your-secret-key';

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async register(registerUserDto: RegisterUserDto) {
    const { email, password, firstName, lastName } = registerUserDto;

    // Check if user already exists
    const existingUser = await this.userModel.findOne({ email });
    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = new this.userModel({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      role: 'user',
    });

    await user.save();

    // Generate token
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      this.jwtSecret,
      { expiresIn: '24h' }
    );

    return {
      token,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    };
  }

  async login(loginUserDto: LoginUserDto) {
    const { email, password } = loginUserDto;

    // Find user
    const user = await this.userModel.findOne({ email });
    if (!user || user.role !== 'user') {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate token
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      this.jwtSecret,
      { expiresIn: '24h' }
    );

    // Update last login
    await this.userModel.findByIdAndUpdate(user._id, { lastLogin: new Date() });

    // Log activity
    try {
      const activity = {
        id: new Date().getTime().toString(),
        activityType: 'login',
        description: 'Logged in to account',
        timestamp: new Date(),
        metadata: { loginMethod: 'email', userAgent: 'web' }
      };

      await this.userModel.findByIdAndUpdate(user._id, {
        $push: {
          activityLog: {
            $each: [activity],
            $slice: -100
          }
        }
      });
    } catch (error) {
      console.error('Error logging login activity:', error);
    }

    return {
      token,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    };
  }

  async adminLogin(adminLoginDto: AdminLoginDto) {
    const { email, password } = adminLoginDto;

    // Find admin user
    const admin = await this.userModel.findOne({ email, role: 'admin' });
    if (!admin) {
      throw new UnauthorizedException('Invalid admin credentials');
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid admin credentials');
    }

    // Generate token
    const token = jwt.sign(
      { userId: admin._id, email: admin.email, role: admin.role },
      this.jwtSecret,
      { expiresIn: '24h' }
    );

    return {
      token,
      user: {
        id: admin._id,
        email: admin.email,
        firstName: admin.firstName,
        lastName: admin.lastName,
        role: admin.role,
      },
    };
  }

  async validateToken(token: string) {
    try {
      const decoded = jwt.verify(token, this.jwtSecret) as any;
      const user = await this.userModel.findById(decoded.userId);
      return user;
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }

  async getAllUsers() {
    const users = await this.userModel.find({}, '-password').exec();
    return users.map(user => ({
      id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      name: `${user.firstName} ${user.lastName}`
    }));
  }
}
