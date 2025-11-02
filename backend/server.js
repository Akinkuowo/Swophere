// server.js - Add these routes to your existing file
const Fastify = require("fastify");
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const cors = require("@fastify/cors");
const jwt = require("jsonwebtoken");
const path = require('path');
const fs = require("fs");
const util = require("util");
const pump = util.promisify(require("stream").pipeline);
const multipart = require("@fastify/multipart");

const app = Fastify({ logger: true });
const prisma = new PrismaClient();

// Decorate app with prisma so it's available everywhere
app.decorate("prisma", prisma);

async function start() {
  // Register CORS globally
  await app.register(cors, {
    origin: ["http://localhost:3000"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], // allow needed methods
    allowedHeaders: ["Content-Type", "Authorization"],    // important!
    credentials: true,
  });

  await app.register(multipart, {
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB
    },
  });
  


// Root route
app.get("/", async () => {
  return { message: "Fastify + Prisma + PostgreSQL is running!" };
});

// Signup endpoint
app.post("/api/auth/signup", {
  schema: {
    body: {
      type: 'object',
      required: ['first_name', 'last_name', 'username', 'email', 'password'],
      properties: {
        first_name: { type: 'string', minLength: 1 },
        last_name: { type: 'string', minLength: 1 },
        username: { type: 'string', minLength: 3 },
        email: { type: 'string', format: 'email' },
        password: { type: 'string', minLength: 6 }
      }
    }
  }
}, async (request, reply) => {
  try {
    const { first_name, last_name, username, email, password } = request.body;

    // Check if email exists
    const existingEmail = await app.prisma.user.findUnique({ where: { email } });
    if (existingEmail) {
      return reply.status(409).send({ success: false, message: 'Email already exists' });
    }

    // Check if username exists
    const existingUsername = await app.prisma.user.findUnique({ where: { username } });
    if (existingUsername) {
      return reply.status(409).send({ success: false, message: 'Username already taken' });
    }

    // Generate user ID & verification token
    const userId = generateUserId();
    const token = crypto.randomBytes(32).toString("hex");

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await app.prisma.user.create({
      data: {
        userId,
        firstName: first_name,
        lastName: last_name,
        username,
        email,
        password: hashedPassword,
        verificationToken: token
      }
    });

    // Send verification email
    const transporter = nodemailer.createTransport({
      service: "gmail", // or your SMTP provider
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    const verificationUrl = `${process.env.FRONTEND_URL}/verify?token=${token}`;

    await transporter.sendMail({
      from: `"Swophere" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "Verify Your LetSwap Account",
      html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #6b21a8;">Welcome to LetSwap!</h2>
        <p>Thank you for signing up. Please verify your email address to activate your account.</p>
        <a href="${verificationUrl}" 
           style="display: inline-block; padding: 12px 24px; background-color: #6b21a8; color: white; text-decoration: none; border-radius: 4px;">
          Verify Email Address
        </a>
        <p>Or copy and paste this link in your browser:</p>
        <p>${verificationUrl}</p>
        <p>This link will expire in 24 hours.</p>
      </div>
    `,
    });

    return {
      success: true,
      message: 'Registration successful! Please check your email to verify your account.'
    };

  } catch (error) {
    app.log.error('Signup error:', error);
    reply.status(500).send({ success: false, message: 'Internal server error', details: error.message });
  }
});

//Email verify endpoint
app.get("/api/auth/verify", async (request, reply) => {
  const { token } = request.query;

  if (!token) {
    return reply.status(400).send({ success: false, message: "Invalid token" });
  }

  const user = await app.prisma.user.findFirst({ where: { verificationToken: token } });

  if (!user) {
    return reply.status(400).send({ success: false, message: "Invalid or expired token" });
  }

  await app.prisma.user.update({
    where: { id: user.id },
    data: { isVerified: true, verificationToken: null }
  });

  return { success: true, message: "Email verified successfully. You can now log in." };
});

// Login endpoint
app.post("/api/auth/login", {
    schema: {
      body: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", format: "email" },
          password: { type: "string", minLength: 6 }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { email, password } = request.body;

    // Find user by email
    const user = await app.prisma.user.findUnique({ where: { email } });

    if (!user) {
      return reply.status(401).send({ success: false, message: "Invalid email or password" });
    }

    // ✅ Block unverified emails
    if (!user.isVerified) {
      return reply.status(403).send({ success: false, message: "Please verify your email before logging in." });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return reply.status(401).send({ success: false, message: "Invalid email or password" });
    }

    // Update last login
    await app.prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() }
    });

    // ✅ Create JWT session
    const token = jwt.sign(
      { id: user.id, email: user.email }, 
      process.env.JWT_SECRET, 
      { expiresIn: "1h" }
    );

    return reply.send({
      success: true,
      message: "Login successful",
      user: {
        id: user.id,
        userId: user.userId,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        email: user.email
      },
      session: {
        token,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString()
      }
    });
  } catch (error) {
    app.log.error("Login error:", error);
    return reply.status(500).send({ success: false, message: "Internal server error" });
  }
});

// Check username availability
app.get("/api/auth/check-username/:username", async (request, reply) => {
  try {
    const { username } = request.params;
    
    const existingUser = await app.prisma.user.findUnique({
      where: { username }
    });

    return {
      available: !existingUser
    };
  } catch (error) {
    app.log.error('Username check error:', error);
    reply.status(500).send({ error: 'Internal server error' });
  }
});

// Check email availability
app.get("/api/auth/check-email/:email", async (request, reply) => {
  try {
    const { email } = request.params;
    
    const existingUser = await app.prisma.user.findUnique({
      where: { email }
    });

    return {
      available: !existingUser
    };
  } catch (error) {
    app.log.error('Email check error:', error);
    reply.status(500).send({ error: 'Internal server error' });
  }
});

 // ✅ Get User Profile
 app.get("/api/user/profile", async (request, reply) => {
  try {
    const { userId } = request.query;
    if (!userId) {
      return reply.status(400).send({ success: false, message: "userId is required" });
    }

    const user = await prisma.user.findUnique({
      where: { userId },
      select: {
        id: true,
        userId: true,
        firstName: true,
        lastName: true,
        username: true,
        email: true,
      },
    });

    if (!user) {
      return reply.status(404).send({ success: false, message: "User not found" });
    }

    return { success: true, user };
  } catch (err) {
    app.log.error(err);
    return reply.status(500).send({ success: false, message: "Internal server error" });
  }
});

// Get user profile by username
app.get("/api/user/profile/:username", async (request, reply) => {
  try {
    const { username } = request.params;

    const user = await app.prisma.user.findUnique({
      where: { username },
      select: {
        userId: true,
        firstName: true,
        lastName: true,
        username: true,
        email: true,
        phone: true,
        dateOfBirth: true,
        country: true,
        state: true,
        address: true,
        facebook: true,
        twitter: true,
        linkedin: true,
        instagram: true,
        createdAt: true
      }
    });

    if (!user) {
      return reply.status(404).send({
        success: false,
        message: 'User not found'
      });
    }

    return { success: true, user };
  } catch (error) {
    app.log.error('Profile fetch error:', error);
    reply.status(500).send({ success: false, message: "Internal server error", details: error.message });
  }
});

// Update user profile
app.put("/api/user/profile/update", async (request, reply) => {
  try {
    const {
      userId,
      firstName,
      lastName,
      phone,
      dateOfBirth,
      country,
      state,
      address,
      facebook,
      twitter,
      linkedin,
      instagram
    } = request.body;

    if (!userId) {
      return reply.status(400).send({
        success: false,
        message: "User ID is required"
      });
    }

    const updatedUser = await app.prisma.user.update({
      where: { userId },
      data: {
        firstName,
        lastName,
        phone,
        dateOfBirth,
        country,
        state,
        address,
        facebook,
        twitter,
        linkedin,
        instagram
      },
      select: {
        userId: true,
        firstName: true,
        lastName: true,
        username: true,
        email: true,
        phone: true,
        dateOfBirth: true,
        country: true,
        state: true,
        address: true,
        facebook: true,
        twitter: true,
        linkedin: true,
        instagram: true
      }
    });

    return {
      success: true,
      message: 'Profile updated successfully',
      user: updatedUser
    };

  } catch (error) {
    app.log.error('Profile update error:', error);
    reply.status(500).send({
      success: false,
      message: 'Internal server error'
    });
  }
});

// ✅ Get Trending Swaps
app.get("/api/swaps/trending", async (request, reply) => {
  try {
    const swaps = await prisma.swap.findMany({
      where: { trending: true },
      take: 12,
      orderBy: { createdAt: "desc" },
    });

    return { success: true, swaps };
  } catch (err) {
    app.log.error(err);
    return reply.status(500).send({ success: false, message: "Failed to fetch swaps" });
  }
});


// Ensure upload dir exists
const uploadDir = path.join(__dirname, "../frontend/public/swap_images");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Create swap endpoint
app.post("/api/swaps/create", async (req, reply) => {
  let fileUploaded = null;

  try {
    const parts = req.parts();
    let body = {};
   

    for await (const part of parts) {
      if (part.file) {
        // Validate file type
        if (!part.mimetype.startsWith("image/")) {
          return reply.status(400).send({
            success: false,
            message: "Only image files are allowed",
          });
        }

        // Validate file size (max 5MB)
        const maxSize = 5 * 1024 * 1024; // 5MB
        let fileSize = 0;
        const chunks = [];
        
        for await (const chunk of part.file) {
          fileSize += chunk.length;
          chunks.push(chunk);
          if (fileSize > maxSize) {
            return reply.status(400).send({
              success: false,
              message: "File size must be less than 5MB",
            });
          }
        }

        // Generate unique name
        const uniqueName =
          Date.now() +
          "-" +
          Math.round(Math.random() * 1e9) +
          path.extname(part.filename);

        const filePath = path.join(uploadDir, uniqueName);
        
        // Write file from collected chunks
        const fileBuffer = Buffer.concat(chunks);
        await fs.promises.writeFile(filePath, fileBuffer);

        fileUploaded = uniqueName;
      } else {
        // Handle text fields
        body[part.fieldname] = part.value;
      }
    }

    const {
      listing_title,
      category,
      country,
      city,
      description,
      interested_swaps,
      currency,
      username,
      user_id,
      listing_id,
    } = body;

    // Validate required fields
    if (
      !listing_title ||
      !category ||
      !country ||
      !city ||
      !description ||
      !username ||
      !user_id ||
      !listing_id
    ) {
      return reply.status(400).send({
        success: false,
        message: "All required fields are missing",
      });
    }

    // Parse interested_swaps if provided
    let interestedSwapsArray = [];
    try {
      interestedSwapsArray = interested_swaps ? JSON.parse(interested_swaps) : [];
    } catch (parseError) {
      console.error('Error parsing interested_swaps:', parseError);
      return reply.status(400).send({
        success: false,
        message: "Invalid format for interested swaps data",
      });
    }

    // Validate that at least one interested swap item is provided
    if (interestedSwapsArray.length === 0) {
      return reply.status(400).send({
        success: false,
        message: "At least one interested swap item is required",
      });
    }

    if (!fileUploaded) {
      return reply.status(400).send({
        success: false,
        message: "Image is required",
      });
    }

    // Check if user exists
    const user = await app.prisma.user.findUnique({
      where: { userId: user_id }
    });

    if (!user) {
      return reply.status(404).send({
        success: false,
        message: "User not found",
      });
    }

    // Check if listing_id already exists
    const existingSwap = await app.prisma.swap.findUnique({
      where: { listing_id: listing_id }
    });

    if (existingSwap) {
      return reply.status(409).send({
        success: false,
        message: "Swap with this ID already exists",
      });
    }

    // Save to DB
    const swap = await app.prisma.swap.create({
      data: {
        listing_id: listing_id,
        title: listing_title,
        name: username,
        category: category,
        country: country,
        city: city,
        image_name: fileUploaded,
        description: description,
        interested_swaps: interestedSwapsArray, // Store as JSON array
        trending: false,
        status: "PENDING",
        userId: user_id
      },
      include: {
        user: {
          select: {
            userId: true,
            firstName: true,
            lastName: true,
            username: true
          }
        }
      }
    });

    // Create review count
    await app.prisma.reviewCount.create({
      data: {
        swap_id: listing_id,
        num: 0,
      },
    });

    // Send notification email (optional - you can implement this later)
    try {
      await sendSwapNotificationEmail({
        swapId: listing_id,
        title: listing_title,
        username: username,
        userEmail: user.email
      });
    } catch (emailError) {
      console.error('Failed to send notification email:', emailError);
      // Don't fail the request if email fails
    }

    reply.status(201).send({
      success: true,
      message: "Swap created successfully and is pending approval",
      swap: {
        id: swap.id,
        listing_id: swap.listing_id,
        title: swap.title,
        category: swap.category,
        status: swap.status,
        interested_swaps: swap.interested_swaps
      },
    });
  } catch (error) {
    app.log.error("Create swap error:", error);
    
    // Clean up uploaded file if error occurred after file was saved
    if (fileUploaded) {
      try {
        const filePath = path.join(uploadDir, fileUploaded);
        await fs.promises.unlink(filePath);
      } catch (cleanupError) {
        console.error('Error cleaning up uploaded file:', cleanupError);
      }
    }

    reply.status(500).send({
      success: false,
      message: "Internal server error",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

// Get message threads for a user - UPDATED VERSION
app.get("/api/messages/threads/:username", async (request, reply) => {
  try {
    const { username } = request.params;

    // Get all messages involving this user
    const messages = await app.prisma.message.findMany({
      where: {
        OR: [
          { fromUser: username },
          { toUser: username }
        ]
      },
      orderBy: {
        timestamp: 'desc'
      }
    });

    // Group messages by conversation partner
    const conversationMap = new Map();
    
    messages.forEach(message => {
      const otherUser = message.fromUser === username ? message.toUser : message.fromUser;
      
      // Only keep the most recent message for each conversation
      if (!conversationMap.has(otherUser)) {
        conversationMap.set(otherUser, {
          id: message.id,
          otherUser: otherUser,
          lastMessage: message.message,
          timestamp: message.timestamp,
          unread: !message.read && message.toUser === username
        });
      } else {
        // Update unread status if there are any unread messages
        const existing = conversationMap.get(otherUser);
        if (!message.read && message.toUser === username) {
          existing.unread = true;
        }
      }
    });

    // Convert map to array and sort by timestamp
    const formattedThreads = Array.from(conversationMap.values())
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return {
      success: true,
      threads: formattedThreads
    };
  } catch (error) {
    app.log.error('Get threads error:', error);
    reply.status(500).send({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get messages between two users - UPDATED VERSION
app.get("/api/messages/:user1/:user2", async (request, reply) => {
  try {
    const { user1, user2 } = request.params;

    const messages = await app.prisma.message.findMany({
      where: {
        OR: [
          {
            fromUser: user1,
            toUser: user2
          },
          {
            fromUser: user2,
            toUser: user1
          }
        ]
      },
      orderBy: {
        timestamp: 'asc'
      }
    });

    // Automatically mark messages as read when fetched
    if (messages.length > 0) {
      const unreadMessages = messages.filter(msg => 
        msg.toUser === user1 && msg.fromUser === user2 && !msg.read
      );

      if (unreadMessages.length > 0) {
        await app.prisma.message.updateMany({
          where: {
            fromUser: user2,
            toUser: user1,
            read: false
          },
          data: {
            read: true
          }
        });

        // Mark notifications as read for these messages
        await app.prisma.notification.updateMany({
          where: {
            userId: user1,
            type: 'MESSAGE',
            relatedUsername: user2,
            isRead: false
          },
          data: {
            isRead: true
          }
        });
      }
    }

    return {
      success: true,
      messages: messages
    };
  } catch (error) {
    app.log.error('Get messages error:', error);
    reply.status(500).send({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Send a message - UPDATED VERSION WITH IN-APP NOTIFICATIONS
app.post("/api/messages/send", async (request, reply) => {
  try {
    const { fromUser, toUser, message } = request.body;

    // Validate required fields
    if (!fromUser || !toUser || !message) {
      return reply.status(400).send({
        success: false,
        message: 'All fields (fromUser, toUser, message) are required'
      });
    }

    // Validate message is not empty after trimming
    if (message.trim().length === 0) {
      return reply.status(400).send({
        success: false,
        message: 'Message cannot be empty'
      });
    }

    // Validate users exist
    const fromUserData = await app.prisma.user.findUnique({
      where: { username: fromUser }
    });

    const toUserData = await app.prisma.user.findUnique({
      where: { username: toUser }
    });

    if (!fromUserData) {
      return reply.status(404).send({
        success: false,
        message: 'Sender user not found'
      });
    }

    if (!toUserData) {
      return reply.status(404).send({
        success: false,
        message: 'Recipient user not found'
      });
    }

    // Prevent users from messaging themselves
    if (fromUser === toUser) {
      return reply.status(400).send({
        success: false,
        message: 'You cannot send messages to yourself'
      });
    }

    // Create the message
    const newMessage = await app.prisma.message.create({
      data: {
        fromUser,
        toUser,
        message: message.trim(),
        read: false,
        timestamp: new Date()
      }
    });

    // Create in-app notification for recipient
    try {
      const messagePreview = message.trim().length > 50 
        ? message.trim().substring(0, 50) + '...' 
        : message.trim();

      await app.prisma.notification.create({
        data: {
          userId: toUserData.username,
          type: 'MESSAGE',
          title: 'New Message',
          message: `${fromUserData.firstName} ${fromUserData.lastName} sent you a message`,
          relatedId: newMessage.id,
          relatedUsername: fromUser,
          metadata: {
            senderName: `${fromUserData.firstName} ${fromUserData.lastName}`,
            messagePreview: messagePreview
          },
          isRead: false,
          createdAt: new Date()
        }
      });

      app.log.info(`In-app notification created for ${toUser} about message from ${fromUser}`);
    } catch (notificationError) {
      app.log.error('Failed to create in-app notification:', notificationError);
      // Don't fail the request if notification creation fails
    }

    return {
      success: true,
      message: 'Message sent successfully',
      messageId: newMessage.id,
      timestamp: newMessage.timestamp
    };
  } catch (error) {
    app.log.error('Send message error:', error);
    reply.status(500).send({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Mark messages as read - UPDATED VERSION WITH NOTIFICATION UPDATE
app.post("/api/messages/mark-read", async (request, reply) => {
  try {
    const { username, otherUser } = request.body;

    if (!username || !otherUser) {
      return reply.status(400).send({
        success: false,
        message: 'Username and otherUser are required'
      });
    }

    // Mark messages as read
    const result = await app.prisma.message.updateMany({
      where: {
        fromUser: otherUser,
        toUser: username,
        read: false
      },
      data: {
        read: true
      }
    });

    // Mark related notifications as read
    if (result.count > 0) {
      await app.prisma.notification.updateMany({
        where: {
          userId: username,
          type: 'MESSAGE',
          relatedUsername: otherUser,
          isRead: false
        },
        data: {
          isRead: true
        }
      });
    }

    return {
      success: true,
      message: 'Messages marked as read',
      count: result.count
    };
  } catch (error) {
    app.log.error('Mark read error:', error);
    reply.status(500).send({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get unread message count for a user - UPDATED
app.get("/api/messages/unread/:username", async (request, reply) => {
  try {
    const { username } = request.params;

    const unreadCount = await app.prisma.message.count({
      where: {
        toUser: username,
        read: false
      }
    });

    return {
      success: true,
      unreadCount
    };
  } catch (error) {
    app.log.error('Get unread count error:', error);
    reply.status(500).send({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Delete a message - WITH NOTIFICATION CLEANUP
app.delete("/api/messages/:messageId", async (request, reply) => {
  try {
    const { messageId } = request.params;
    const { username } = request.body; // User requesting deletion

    if (!username) {
      return reply.status(400).send({
        success: false,
        message: 'Username is required'
      });
    }

    // Find the message
    const message = await app.prisma.message.findUnique({
      where: { id: messageId }
    });

    if (!message) {
      return reply.status(404).send({
        success: false,
        message: 'Message not found'
      });
    }

    // Only allow the sender to delete their own messages
    if (message.fromUser !== username) {
      return reply.status(403).send({
        success: false,
        message: 'You can only delete your own messages'
      });
    }

    // Delete the message
    await app.prisma.message.delete({
      where: { id: messageId }
    });

    // Delete related notification
    await app.prisma.notification.deleteMany({
      where: {
        type: 'MESSAGE',
        relatedId: messageId
      }
    });

    return {
      success: true,
      message: 'Message deleted successfully'
    };
  } catch (error) {
    app.log.error('Delete message error:', error);
    reply.status(500).send({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Delete entire conversation - WITH NOTIFICATION CLEANUP
app.delete("/api/messages/conversation/:username/:otherUser", async (request, reply) => {
  try {
    const { username, otherUser } = request.params;

    // Get all message IDs in the conversation
    const messages = await app.prisma.message.findMany({
      where: {
        OR: [
          {
            fromUser: username,
            toUser: otherUser
          },
          {
            fromUser: otherUser,
            toUser: username
          }
        ]
      },
      select: { id: true }
    });

    const messageIds = messages.map(msg => msg.id);

    // Delete all messages
    await app.prisma.message.deleteMany({
      where: {
        OR: [
          {
            fromUser: username,
            toUser: otherUser
          },
          {
            fromUser: otherUser,
            toUser: username
          }
        ]
      }
    });

    // Delete related notifications
    if (messageIds.length > 0) {
      await app.prisma.notification.deleteMany({
        where: {
          type: 'MESSAGE',
          relatedId: { in: messageIds }
        }
      });
    }

    return {
      success: true,
      message: 'Conversation deleted successfully'
    };
  } catch (error) {
    app.log.error('Delete conversation error:', error);
    reply.status(500).send({
      success: false,
      message: 'Internal server error'
    });
  }
});

// ===== NOTIFICATION ENDPOINTS =====

// Get all notifications for a user
app.get("/api/notifications/:username", async (request, reply) => {
  try {
    const { username } = request.params;
    const { limit = 20, offset = 0, unreadOnly = false } = request.query;

    const where = {
      userId: username
    };

    if (unreadOnly === 'true') {
      where.isRead = false;
    }

    const notifications = await app.prisma.notification.findMany({
      where,
      orderBy: {
        createdAt: 'desc'
      },
      take: parseInt(limit),
      skip: parseInt(offset)
    });

    const total = await app.prisma.notification.count({ where });
    const unreadCount = await app.prisma.notification.count({
      where: {
        userId: username,
        isRead: false
      }
    });

    return {
      success: true,
      notifications,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: total > parseInt(offset) + parseInt(limit)
      },
      unreadCount
    };
  } catch (error) {
    app.log.error('Get notifications error:', error);
    reply.status(500).send({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get unread notification count
app.get("/api/notifications/:username/unread-count", async (request, reply) => {
  try {
    const { username } = request.params;

    const unreadCount = await app.prisma.notification.count({
      where: {
        userId: username,
        isRead: false
      }
    });

    return {
      success: true,
      unreadCount
    };
  } catch (error) {
    app.log.error('Get unread notification count error:', error);
    reply.status(500).send({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Mark notification as read
app.put("/api/notifications/:notificationId/read", async (request, reply) => {
  try {
    const { notificationId } = request.params;
    const { username } = request.body;

    if (!username) {
      return reply.status(400).send({
        success: false,
        message: 'Username is required'
      });
    }

    // Verify notification belongs to user
    const notification = await app.prisma.notification.findUnique({
      where: { id: notificationId }
    });

    if (!notification) {
      return reply.status(404).send({
        success: false,
        message: 'Notification not found'
      });
    }

    if (notification.userId !== username) {
      return reply.status(403).send({
        success: false,
        message: 'Not authorized to modify this notification'
      });
    }

    const updatedNotification = await app.prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true }
    });

    return {
      success: true,
      notification: updatedNotification
    };
  } catch (error) {
    app.log.error('Mark notification read error:', error);
    reply.status(500).send({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Mark all notifications as read
app.put("/api/notifications/:username/mark-all-read", async (request, reply) => {
  try {
    const { username } = request.params;

    const result = await app.prisma.notification.updateMany({
      where: {
        userId: username,
        isRead: false
      },
      data: {
        isRead: true
      }
    });

    return {
      success: true,
      message: 'All notifications marked as read',
      count: result.count
    };
  } catch (error) {
    app.log.error('Mark all notifications read error:', error);
    reply.status(500).send({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Delete notification
app.delete("/api/notifications/:notificationId", async (request, reply) => {
  try {
    const { notificationId } = request.params;
    const { username } = request.body;

    if (!username) {
      return reply.status(400).send({
        success: false,
        message: 'Username is required'
      });
    }

    // Verify notification belongs to user
    const notification = await app.prisma.notification.findUnique({
      where: { id: notificationId }
    });

    if (!notification) {
      return reply.status(404).send({
        success: false,
        message: 'Notification not found'
      });
    }

    if (notification.userId !== username) {
      return reply.status(403).send({
        success: false,
        message: 'Not authorized to delete this notification'
      });
    }

    await app.prisma.notification.delete({
      where: { id: notificationId }
    });

    return {
      success: true,
      message: 'Notification deleted successfully'
    };
  } catch (error) {
    app.log.error('Delete notification error:', error);
    reply.status(500).send({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Clear all notifications
app.delete("/api/notifications/:username/clear-all", async (request, reply) => {
  try {
    const { username } = request.params;

    const result = await app.prisma.notification.deleteMany({
      where: {
        userId: username
      }
    });

    return {
      success: true,
      message: 'All notifications cleared',
      count: result.count
    };
  } catch (error) {
    app.log.error('Clear all notifications error:', error);
    reply.status(500).send({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get all swaps with filtering and pagination
app.get("/api/swaps", async (request, reply) => {
  try {
    const { 
      category = 'all', 
      page = 1, 
      limit = 10, 
      status = 'ACCEPTED',
      search = ''
    } = request.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build where clause
    const where = {
      status: status.toUpperCase()
    };

    if (category && category !== 'all') {
      where.category = category;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
        { country: { contains: search, mode: 'insensitive' } }
      ];
    }

    const swaps = await app.prisma.swap.findMany({
      where,
      include: {
        user: {
          select: {
            firstName: true,
            username: true,
            country: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip: parseInt(skip),
      take: parseInt(limit)
    });

    const total = await app.prisma.swap.count({ where });

    return {
      success: true,
      swaps,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    };

  } catch (error) {
    app.log.error('Get swaps error:', error);
    reply.status(500).send({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get single swap by listing_id
app.get("/api/swaps/:id", async (request, reply) => {
  try {
    const { id } = request.params;

    const swap = await app.prisma.swap.findUnique({
      where: {
        listing_id: id
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            username: true,
            email: true,
            country: true,
            state: true,
            createdAt: true
          }
        }
      }
    });

    if (!swap) {
      return reply.status(404).send({
        success: false,
        message: 'Swap not found'
      });
    }

    return {
      success: true,
      swap
    };

  } catch (error) {
    app.log.error('Get swap detail error:', error);
    reply.status(500).send({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Express interest in a swap
app.post("/api/swaps/interest", {
  schema: {
    body: {
      type: 'object',
      required: ['swapId', 'userId'],
      properties: {
        swapId: { type: 'string' },
        userId: { type: 'string' },
        message: { type: 'string' }
      }
    }
  }
}, async (request, reply) => {
  try {
    const { swapId, userId, message = '' } = request.body;

    // Verify swap exists
    const swap = await app.prisma.swap.findUnique({
      where: { listing_id: swapId }
    });

    if (!swap) {
      return reply.status(404).send({
        success: false,
        message: 'Swap not found'
      });
    }

    // Verify user exists
    const user = await app.prisma.user.findUnique({
      where: { userId }
    });

    if (!user) {
      return reply.status(404).send({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent users from expressing interest in their own swaps
    if (swap.userId === userId) {
      return reply.status(400).send({
        success: false,
        message: 'Cannot express interest in your own swap'
      });
    }

    // Update interested_swaps array
    const currentInterested = swap.interested_swaps || [];
    
    // Check if user already expressed interest
    const alreadyInterested = currentInterested.some(interest => 
      interest.userId === userId
    );

    if (alreadyInterested) {
      return reply.status(409).send({
        success: false,
        message: 'You have already expressed interest in this swap'
      });
    }

    // Add new interest
    const newInterest = {
      userId,
      username: user.username,
      message,
      timestamp: new Date().toISOString()
    };

    const updatedInterested = [...currentInterested, newInterest];

    await app.prisma.swap.update({
      where: { listing_id: swapId },
      data: {
        interested_swaps: updatedInterested
      }
    });

    // Send notification to swap owner (optional)
    try {
      await sendInterestNotification({
        swapOwnerId: swap.userId,
        interestedUser: user.username,
        swapTitle: swap.title,
        message
      });
    } catch (notificationError) {
      app.log.error('Interest notification error:', notificationError);
      // Don't fail the request if notification fails
    }

    return {
      success: true,
      message: 'Interest expressed successfully'
    };

  } catch (error) {
    app.log.error('Express interest error:', error);
    reply.status(500).send({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get user's swaps
app.get("/api/swaps/user/:userId", async (request, reply) => {
  try {
    const { userId } = request.params;
    const { status, page = 1, limit = 10 } = request.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = { userId };
    
    if (status) {
      where.status = status.toUpperCase();
    }

    const swaps = await app.prisma.swap.findMany({
      where,
      include: {
        user: {
          select: {
            firstName: true,
            username: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip: parseInt(skip),
      take: parseInt(limit)
    });

    const total = await app.prisma.swap.count({ where });

    return {
      success: true,
      swaps,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    };

  } catch (error) {
    app.log.error('Get user swaps error:', error);
    reply.status(500).send({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update swap status (for admins or swap owners)
app.put("/api/swaps/:id/status", {
  schema: {
    body: {
      type: 'object',
      required: ['status'],
      properties: {
        status: { 
          type: 'string', 
          enum: ['PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED', 'COMPLETED'] 
        },
        reason: { type: 'string' }
      }
    }
  }
}, async (request, reply) => {
  try {
    const { id } = request.params;
    const { status, reason } = request.body;

    const swap = await app.prisma.swap.findUnique({
      where: { listing_id: id }
    });

    if (!swap) {
      return reply.status(404).send({
        success: false,
        message: 'Swap not found'
      });
    }

    const updatedSwap = await app.prisma.swap.update({
      where: { listing_id: id },
      data: { 
        status: status.toUpperCase() 
      },
      include: {
        user: {
          select: {
            firstName: true,
            username: true,
            email: true
          }
        }
      }
    });

    // Send status update notification (optional)
    try {
      await sendStatusUpdateNotification({
        swap: updatedSwap,
        newStatus: status,
        reason
      });
    } catch (notificationError) {
      app.log.error('Status notification error:', notificationError);
    }

    return {
      success: true,
      message: `Swap status updated to ${status}`,
      swap: updatedSwap
    };

  } catch (error) {
    app.log.error('Update swap status error:', error);
    reply.status(500).send({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Delete a swap
app.delete("/api/swaps/:id", async (request, reply) => {
  try {
    const { id } = request.params;
    const { userId } = request.body; // User ID for authorization

    const swap = await app.prisma.swap.findUnique({
      where: { listing_id: id }
    });

    if (!swap) {
      return reply.status(404).send({
        success: false,
        message: 'Swap not found'
      });
    }

    // Check if user owns the swap (or is admin)
    if (swap.userId !== userId) {
      return reply.status(403).send({
        success: false,
        message: 'Not authorized to delete this swap'
      });
    }

    // Delete associated review count
    await app.prisma.reviewCount.deleteMany({
      where: { swap_id: id }
    });

    // Delete the swap
    await app.prisma.swap.delete({
      where: { listing_id: id }
    });

    // Delete swap image file (optional cleanup)
    try {
      const imagePath = path.join(uploadDir, swap.image_name);
      if (fs.existsSync(imagePath)) {
        await fs.promises.unlink(imagePath);
      }
    } catch (fileError) {
      app.log.error('Error deleting swap image:', fileError);
      // Continue even if file deletion fails
    }

    return {
      success: true,
      message: 'Swap deleted successfully'
    };

  } catch (error) {
    app.log.error('Delete swap error:', error);
    reply.status(500).send({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get swap categories
app.get("/api/swaps/categories", async (request, reply) => {
  try {
    const categories = await app.prisma.swap.groupBy({
      by: ['category'],
      _count: {
        id: true
      },
      where: {
        status: 'ACCEPTED'
      }
    });

    return {
      success: true,
      categories: categories.map(cat => ({
        name: cat.category,
        count: cat._count.id
      }))
    };

  } catch (error) {
    app.log.error('Get categories error:', error);
    reply.status(500).send({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Search swaps
app.get("/api/swaps/search/:query", async (request, reply) => {
  try {
    const { query } = request.params;
    const { page = 1, limit = 10 } = request.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const swaps = await app.prisma.swap.findMany({
      where: {
        status: 'ACCEPTED',
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
          { category: { contains: query, mode: 'insensitive' } },
          { city: { contains: query, mode: 'insensitive' } },
          { country: { contains: query, mode: 'insensitive' } }
        ]
      },
      include: {
        user: {
          select: {
            firstName: true,
            username: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip: parseInt(skip),
      take: parseInt(limit)
    });

    const total = await app.prisma.swap.count({
      where: {
        status: 'ACCEPTED',
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
          { category: { contains: query, mode: 'insensitive' } },
          { city: { contains: query, mode: 'insensitive' } },
          { country: { contains: query, mode: 'insensitive' } }
        ]
      }
    });

    return {
      success: true,
      swaps,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    };

  } catch (error) {
    app.log.error('Search swaps error:', error);
    reply.status(500).send({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Add to your Fastify backend
app.get("/api/agreements", async (request, reply) => {
  try {
    const { username } = request.query;

    if (!username) {
      return reply.status(400).send({
        success: false,
        message: "Username is required"
      });
    }

    const agreements = await app.prisma.swopAgreement.findMany({
      where: {
        OR: [
          { from_user: username },
          { to_user: username }
        ]
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    return {
      success: true,
      agreements
    };
  } catch (error) {
    app.log.error('Get agreements error:', error);
    reply.status(500).send({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Updated agreement creation endpoint for skill swaps
app.post("/api/agreements/create", {
  schema: {
    body: {
      type: 'object',
      required: ['fromUser', 'toUser', 'agreementData'],
      properties: {
        fromUser: { type: 'string' },
        toUser: { type: 'string' },
        agreementData: { type: 'object' }
      }
    }
  }
}, async (request, reply) => {
  try {
    const { fromUser, toUser, agreementData } = request.body;

    // Check if both users exist
    const fromUserExists = await app.prisma.user.findUnique({
      where: { username: fromUser }
    });

    const toUserExists = await app.prisma.user.findUnique({
      where: { username: toUser }
    });

    if (!fromUserExists || !toUserExists) {
      return reply.status(404).send({
        success: false,
        message: 'One or both users not found'
      });
    }

    // Generate unique swap ID
    const swopId = `SKILL_SWOP_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create agreement in database
    const agreement = await app.prisma.swopAgreement.create({
      data: {
        swop_id: swopId,
        from_user: fromUser,
        to_user: toUser,
        agreement_status: 'pending',
        agreement_title: agreementData.agreementTitle,
        agreement_type: agreementData.agreementType,
        terms: agreementData.terms,
        timeline_days: calculateTimelineDays(agreementData.skills), // Changed from this.calculateTimelineDays
        meeting_location: agreementData.meetingLocation,
        communication_method: agreementData.communicationMethod,
        dispute_resolution: agreementData.disputeResolution,
        confidentiality: agreementData.confidentiality,
        termination_clause: agreementData.terminationClause,
        special_conditions: agreementData.specialConditions,
        skills: agreementData.skills,
        from_user_accepted: false,
        to_user_accepted: false
      }
    });

    // Create notification for the recipient (toUser)
    await app.prisma.notification.create({
      data: {
        userId: toUser,
        type: 'SKILL_AGREEMENT_CREATED',
        title: 'New Skill Swap Agreement',
        message: `${fromUser} has proposed a skill swap agreement: "${agreementData.agreementTitle}"`,
        relatedId: swopId,
        relatedUsername: fromUser,
        metadata: {
          agreementTitle: agreementData.agreementTitle,
          agreementType: agreementData.agreementType,
          skillsCount: agreementData.skills.length,
          skills: agreementData.skills.map(skill => skill.skillName)
        }
      }
    });

    // Create notification for the sender (fromUser) - confirmation
    await app.prisma.notification.create({
      data: {
        userId: fromUser,
        type: 'SKILL_AGREEMENT_SENT',
        title: 'Skill Swap Agreement Sent',
        message: `You sent a skill swap agreement to ${toUser}. Waiting for their acceptance.`,
        relatedId: swopId,
        relatedUsername: toUser,
        metadata: {
          agreementTitle: agreementData.agreementTitle,
          recipient: toUser
        }
      }
    });

    return {
      success: true,
      message: 'Skill swap agreement created successfully and sent for approval',
      agreement: {
        id: agreement.id,
        swop_id: agreement.swop_id,
        status: agreement.agreement_status
      }
    };

  } catch (error) {
    app.log.error('Create skill agreement error:', error);
    reply.status(500).send({
      success: false,
      message: 'Internal server error',
      details: error.message

    });
  }
});

// Get agreement by ID
app.get("/api/agreements/:swopId", async (request, reply) => {
  try {
    const { swopId } = request.params;

    const agreement = await app.prisma.swopAgreement.findUnique({
      where: { swop_id: swopId }
    });

    if (!agreement) {
      return reply.status(404).send({
        success: false,
        message: 'Agreement not found'
      });
    }

    return {
      success: true,
      agreement
    };

  } catch (error) {
    app.log.error('Get agreement error:', error);
    reply.status(500).send({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Accept agreement
app.post("/api/agreements/:swopId/accept", {
  schema: {
    body: {
      type: 'object',
      required: ['username'],
      properties: {
        username: { type: 'string' }
      }
    }
  }
}, async (request, reply) => {
  try {
    const { swopId } = request.params;
    const { username } = request.body;

    const agreement = await app.prisma.swopAgreement.findUnique({
      where: { swop_id: swopId }
    });

    if (!agreement) {
      return reply.status(404).send({
        success: false,
        message: 'Agreement not found'
      });
    }

    // Check if user is the recipient
    if (agreement.to_user !== username) {
      return reply.status(403).send({
        success: false,
        message: 'Only the agreement recipient can accept this agreement'
      });
    }

    // Check if already accepted
    if (agreement.to_user_accepted) {
      return reply.status(400).send({
        success: false,
        message: 'Agreement already accepted'
      });
    }

    // Update agreement
    const updatedAgreement = await app.prisma.swopAgreement.update({
      where: { swop_id: swopId },
      data: {
        to_user_accepted: true,
        agreement_status: 'accepted',
        updated_at: new Date()
      }
    });

    // Create notification for the creator
    await app.prisma.notification.create({
      data: {
        userId: agreement.from_user,
        type: 'AGREEMENT_ACCEPTED',
        title: 'Agreement Accepted!',
        message: `${username} has accepted your skill swap agreement: "${agreement.agreement_title}"`,
        relatedId: swopId,
        relatedUsername: username,
        metadata: {
          agreementTitle: agreement.agreement_title
        }
      }
    });

    return {
      success: true,
      message: 'Agreement accepted successfully',
      agreement: updatedAgreement
    };

  } catch (error) {
    app.log.error('Accept agreement error:', error);
    reply.status(500).send({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Decline agreement
app.post("/api/agreements/:swopId/decline", {
  schema: {
    body: {
      type: 'object',
      required: ['username'],
      properties: {
        username: { type: 'string' },
        reason: { type: 'string' }
      }
    }
  }
}, async (request, reply) => {
  try {
    const { swopId } = request.params;
    const { username, reason } = request.body;

    const agreement = await app.prisma.swopAgreement.findUnique({
      where: { swop_id: swopId }
    });

    if (!agreement) {
      return reply.status(404).send({
        success: false,
        message: 'Agreement not found'
      });
    }

    // Check if user is the recipient
    if (agreement.to_user !== username) {
      return reply.status(403).send({
        success: false,
        message: 'Only the agreement recipient can decline this agreement'
      });
    }

    // Update agreement
    const updatedAgreement = await app.prisma.swopAgreement.update({
      where: { swop_id: swopId },
      data: {
        agreement_status: 'declined',
        updated_at: new Date()
      }
    });

    // Create notification for the creator
    await app.prisma.notification.create({
      data: {
        userId: agreement.from_user,
        type: 'AGREEMENT_DECLINED',
        title: 'Agreement Declined',
        message: `${username} has declined your skill swap agreement: "${agreement.agreement_title}"`,
        relatedId: swopId,
        relatedUsername: username,
        metadata: {
          agreementTitle: agreement.agreement_title,
          reason: reason || 'No reason provided'
        }
      }
    });

    return {
      success: true,
      message: 'Agreement declined successfully',
      agreement: updatedAgreement
    };

  } catch (error) {
    app.log.error('Decline agreement error:', error);
    reply.status(500).send({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Helper function to calculate timeline in days
function calculateTimelineDays(skills) {
  // This is a simplified calculation - you might want to make it more sophisticated
  const maxDuration = skills.reduce((max, skill) => {
    const duration = skill.duration;
    if (duration.includes('month')) {
      return Math.max(max, parseInt(duration) * 30);
    } else if (duration.includes('week')) {
      return Math.max(max, parseInt(duration) * 7);
    }
    return Math.max(max, parseInt(duration) || 7);
  }, 0);
  
  return maxDuration || 30; // Default to 30 days if no duration specified
}

// Helper function for interest notifications
async function sendInterestNotification({ swapOwnerId, interestedUser, swapTitle, message }) {
  try {
    const swapOwner = await app.prisma.user.findUnique({
      where: { userId: swapOwnerId }
    });

    if (!swapOwner) return;

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    await transporter.sendMail({
      from: `"Swophere" <${process.env.SMTP_USER}>`,
      to: swapOwner.email,
      subject: `New Interest in Your Swap: ${swapTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #6b21a8;">New Swap Interest!</h2>
          <p><strong>${interestedUser}</strong> is interested in your swap: <strong>${swapTitle}</strong></p>
          ${message ? `<p><strong>Message:</strong> ${message}</p>` : ''}
          <p>Log in to your account to view and manage interests.</p>
          <a href="${process.env.FRONTEND_URL}/dashboard" 
             style="display: inline-block; padding: 12px 24px; background-color: #6b21a8; color: white; text-decoration: none; border-radius: 4px;">
            View Dashboard
          </a>
        </div>
      `,
    });

    app.log.info(`Interest notification sent to ${swapOwner.email}`);
  } catch (error) {
    app.log.error('Failed to send interest notification:', error);
    throw error;
  }
}

// Helper function for status update notifications
async function sendStatusUpdateNotification({ swap, newStatus, reason }) {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    let subject = '';
    let message = '';

    switch (newStatus.toUpperCase()) {
      case 'ACCEPTED':
        subject = `Your Swap "${swap.title}" Has Been Approved`;
        message = `Great news! Your swap listing "${swap.title}" has been approved and is now live on the platform.`;
        break;
      case 'REJECTED':
        subject = `Your Swap "${swap.title}" Was Not Approved`;
        message = `Your swap listing "${swap.title}" was not approved.${reason ? ` Reason: ${reason}` : ''}`;
        break;
      case 'CANCELLED':
        subject = `Swap "${swap.title}" Has Been Cancelled`;
        message = `Your swap listing "${swap.title}" has been cancelled.${reason ? ` Reason: ${reason}` : ''}`;
        break;
      default:
        subject = `Update on Your Swap "${swap.title}"`;
        message = `The status of your swap listing "${swap.title}" has been updated to ${newStatus}.`;
    }

    await transporter.sendMail({
      from: `"Swophere" <${process.env.SMTP_USER}>`,
      to: swap.user.email,
      subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #6b21a8;">Swap Status Update</h2>
          <p>${message}</p>
          <a href="${process.env.FRONTEND_URL}/swaps/${swap.listing_id}" 
             style="display: inline-block; padding: 12px 24px; background-color: #6b21a8; color: white; text-decoration: none; border-radius: 4px;">
            View Swap
          </a>
        </div>
      `,
    });

    app.log.info(`Status notification sent to ${swap.user.email}`);
  } catch (error) {
    app.log.error('Failed to send status notification:', error);
    throw error;
  }
}

// Helper function for email notification (optional)
async function sendSwapNotificationEmail({ swapId, title, username, userEmail }) {
  // Implement your email sending logic here
  // This could use nodemailer, SendGrid, etc.
  console.log(`Swap created notification - ID: ${swapId}, Title: ${title}, User: ${username}`);
  return Promise.resolve();
}


// Helper functions
function generateUserId() {
  const randomPart = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `SH_${randomPart}`;
}

function generateSessionToken() {
  return Buffer.from(Math.random().toString(36).substring(2) + Date.now().toString(36)).toString('base64');
}

// Start server

  try {
    await app.listen({ port: 4000, host: "0.0.0.0" });
    app.log.info("🚀 Server listening on http://localhost:4000");
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();