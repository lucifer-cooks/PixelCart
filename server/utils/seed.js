const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const Category = require('../models/Category');
const Product = require('../models/Product');
const Review = require('../models/Review');
const Order = require('../models/Order');

dotenv.config();

const categoriesData = [
  { name: 'Gaming Mice', description: 'Ultra-lightweight wireless and wired precision mice.' },
  { name: 'Keyboards', description: 'Hot-swappable custom mechanical keyboards and accessories.' },
  { name: 'Audio Gear', description: 'Studio-grade gaming headsets, sound mixers, and microphones.' },
  { name: 'Streaming Gear', description: 'High-definition webcams, ring lights, and stream controllers.' },
  { name: 'Accessories', description: 'RGB deskmats, mouse bungees, headset stands, and customized keycaps.' }
];

const seedData = async (shouldCloseConn = true) => {
  try {
    if (shouldCloseConn) {
      const connStr = process.env.MONGODB_URI || 'mongodb://localhost:27017/pixelgear';
      await mongoose.connect(connStr);
    }
    console.log('Connected to DB for seeding...');

    // Clear existing data
    await User.deleteMany();
    await Category.deleteMany();
    await Product.deleteMany();
    await Review.deleteMany();
    await Order.deleteMany();
    console.log('Existing data cleared.');

    // Seed Users
    const adminUser = new User({
      name: 'Admin PixelGear',
      email: 'admin@pixelgear.com',
      password: 'admin123',
      role: 'admin',
      shippingAddress: {
        street: '101 Cyber Way',
        city: 'Neo-Tokyo',
        state: 'Kanto',
        zipCode: '100-0001',
        country: 'Japan'
      },
      billingAddress: {
        street: '101 Cyber Way',
        city: 'Neo-Tokyo',
        state: 'Kanto',
        zipCode: '100-0001',
        country: 'Japan'
      }
    });

    const customerUser = new User({
      name: 'John Doe',
      email: 'customer@pixelgear.com',
      password: 'customer123',
      role: 'customer',
      shippingAddress: {
        street: '404 Grid Avenue',
        city: 'Silicon Valley',
        state: 'California',
        zipCode: '94025',
        country: 'USA'
      },
      billingAddress: {
        street: '404 Grid Avenue',
        city: 'Silicon Valley',
        state: 'California',
        zipCode: '94025',
        country: 'USA'
      }
    });

    await adminUser.save();
    await customerUser.save();
    console.log('Users seeded successfully!');

    // Seed Categories
    const categories = [];
    for (const cat of categoriesData) {
      const created = await Category.create(cat);
      categories.push(created);
    }
    console.log('Categories seeded successfully!');

    const miceId = categories.find(c => c.name === 'Gaming Mice')._id;
    const kbId = categories.find(c => c.name === 'Keyboards')._id;
    const audioId = categories.find(c => c.name === 'Audio Gear')._id;
    const streamId = categories.find(c => c.name === 'Streaming Gear')._id;
    const accId = categories.find(c => c.name === 'Accessories')._id;

    // Seed Products
    const productsData = [
      {
        title: 'PixelGear Apex-X Wireless',
        description: 'Ultralight 54g wireless gaming mouse equipped with PAW3395 optical sensor, 26K DPI, and zero-latency wireless receiver.',
        price: 129.99,
        category: miceId,
        brand: 'PixelGear',
        stock: 20,
        images: ['https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?q=80&w=600&auto=format&fit=crop'],
        specifications: {
          switchType: 'Optical Mouse Switches',
          layout: 'Ambidextrous Ultralight',
          hotSwappable: false,
          keycaps: 'PTFE Feet',
          connectivity: '2.4Ghz Wireless / USB-C'
        }
      },
      {
        title: 'PixelGear Titan-G Wireless',
        description: 'Ergonomic gaming mouse featuring robust click-latency switches, 16K DPI optical sensor, and customizable RGB zone lighting.',
        price: 79.99,
        category: miceId,
        brand: 'PixelGear',
        stock: 25,
        images: ['https://images.unsplash.com/photo-1625600243103-1dc6824c6c8a?q=80&w=600&auto=format&fit=crop'],
        specifications: {
          switchType: 'Mechanical Mouse Switches',
          layout: 'Right-Handed Ergonomic',
          hotSwappable: false,
          keycaps: 'Textured Side Grips',
          connectivity: '2.4Ghz Wireless / Bluetooth'
        }
      },
      {
        title: 'PixelGear Cyber65 Keyboard',
        description: 'Flagship 65% custom mechanical keyboard featuring hot-swappable PCB, translucent acrylic case, glowing RGB underglow, and lubed silent linear switches.',
        price: 189.99,
        category: kbId,
        brand: 'PixelGear',
        stock: 15,
        images: ['https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?q=80&w=600&auto=format&fit=crop'],
        specifications: {
          switchType: 'Linear (Lubed Teal)',
          layout: '65% Form Factor',
          hotSwappable: true,
          keycaps: 'Double-shot Cherry PBT',
          connectivity: 'USB-C / Bluetooth 5.0'
        }
      },
      {
        title: 'AeroSound Pro Headset',
        description: 'Immersive gaming headset featuring 50mm Neodymium drivers, detachable noise-cancelling microphone, and cloud-foam cooling ear cups.',
        price: 159.99,
        category: audioId,
        brand: 'AeroSound',
        stock: 12,
        images: ['https://images.unsplash.com/photo-1546435770-a3e426bf472b?q=80&w=600&auto=format&fit=crop'],
        specifications: {
          switchType: 'Dynamic 50mm Drivers',
          layout: 'Over-ear Wireless',
          hotSwappable: false,
          keycaps: 'Cooling-gel Leatherette pads',
          connectivity: '2.4Ghz Lossless Wireless'
        }
      },
      {
        title: 'AeroSound StreamMic Studio',
        description: 'Professional condenser microphone for streamers and podcasters. Features cardioid/bidirectional patterns, high-res audio recording, and XLR/USB modes.',
        price: 149.99,
        category: audioId,
        brand: 'AeroSound',
        stock: 15,
        images: ['https://images.unsplash.com/photo-1590608897129-79da98d15969?q=80&w=600&auto=format&fit=crop'],
        specifications: {
          switchType: 'Dual Condenser Capsules',
          layout: 'Desktop Metal Stand',
          hotSwappable: false,
          keycaps: 'Heavy-Duty Shock Mount',
          connectivity: 'USB-C / XLR Dual Output'
        }
      },
      {
        title: 'Halo RGB USB Microphone',
        description: 'Cardioid USB desktop microphone with glowing RGB lighting, quick-mute tap sensor, and built-in anti-vibration shock mount.',
        price: 89.99,
        category: audioId,
        brand: 'PixelGear',
        stock: 10,
        images: ['https://images.unsplash.com/photo-1590608897129-79da98d15969?q=80&w=600&auto=format&fit=crop'],
        specifications: {
          switchType: 'Cardioid Polar Pattern',
          layout: 'Studio Condenser',
          hotSwappable: false,
          keycaps: 'Built-in Pop Filter',
          connectivity: 'USB-C Plug & Play'
        }
      },
      {
        title: 'StreamCam 4K Ultra HD',
        description: 'High-definition 4K webcam running at 30fps with automatic HDR light correction, dual stereo mics, and physical privacy shutter.',
        price: 199.99,
        category: streamId,
        brand: 'StreamLabs',
        stock: 8,
        images: ['https://images.unsplash.com/photo-1603184017968-963d76717a6a?q=80&w=600&auto=format&fit=crop'],
        specifications: {
          switchType: 'Sony STARVIS CMOS Sensor',
          layout: 'Tripod Mountable',
          hotSwappable: false,
          keycaps: 'Privacy Cover',
          connectivity: 'USB 3.0 Wired'
        }
      },
      {
        title: 'StreamLabs GlowRing 10"',
        description: 'Desktop 10-inch ring light with dimmable LED zones, 3 lighting temperatures (cool, warm, natural), and fully adjustable tripod with phone clamp.',
        price: 49.99,
        category: streamId,
        brand: 'StreamLabs',
        stock: 22,
        images: ['https://images.unsplash.com/photo-1522069169874-c58ec4b76be5?q=80&w=600&auto=format&fit=crop'],
        specifications: {
          switchType: 'Dimmable LED Array',
          layout: 'Desktop Ring Setup',
          hotSwappable: false,
          keycaps: 'Phone Holder Attachment',
          connectivity: 'USB Powered 5V'
        }
      },
      {
        title: 'Omega Sentinel RGB Headset Stand',
        description: 'A structural headset stand crafted with premium grade aluminum. Integrates dynamic RGB light zones and a 2-port USB 3.0 pass-through hub.',
        price: 39.99,
        category: accId,
        brand: 'PixelGear',
        stock: 18,
        images: ['https://images.unsplash.com/photo-1608248597481-496100c80836?q=80&w=600&auto=format&fit=crop'],
        specifications: {
          switchType: 'RGB Dynamic Light Bar',
          layout: 'Headset Mount with USB Hub',
          hotSwappable: false,
          keycaps: 'Non-slip Silicone Base',
          connectivity: 'USB-A 3.0 Input'
        }
      },
      {
        title: 'Dragon Flame Artisan Keycap',
        description: 'Handcrafted premium resin keycap featuring a detailed neon red dragon breathing glowing amber flame. Compatible with Cherry MX switches.',
        price: 49.99,
        category: accId,
        brand: 'ArtisanCraft',
        stock: 5,
        images: ['https://images.unsplash.com/photo-1601445638532-3c6f6c3aa1d6?q=80&w=600&auto=format&fit=crop'],
        specifications: {
          switchType: 'N/A',
          layout: '1U Cherry stem fit',
          hotSwappable: true,
          keycaps: 'Handmade Resin',
          connectivity: 'N/A'
        }
      },
      {
        title: 'Retro Terminal XL Deskmat',
        description: 'Enormous 900x400mm mousepad with green phosphorescent code-rain graphics. Micro-weave textures optimized for optical sensors.',
        price: 29.99,
        category: accId,
        brand: 'PixelGear',
        stock: 30,
        images: ['https://images.unsplash.com/photo-1547082299-de196ea013d6?q=80&w=600&auto=format&fit=crop'],
        specifications: {
          switchType: 'N/A',
          layout: '900x400x4mm',
          hotSwappable: false,
          keycaps: 'Stitched Edges',
          connectivity: 'N/A'
        }
      },
      {
        title: 'Chroma Horizon Deskmat',
        description: 'Dynamic neon sunset gradient desk mat. Waterproof coating, heavy rubber grip base to secure custom keyboard and mouse setups.',
        price: 28.00,
        category: accId,
        brand: 'PixelGear',
        stock: 25,
        images: ['https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=600&auto=format&fit=crop'],
        specifications: {
          switchType: 'N/A',
          layout: '900x400x4mm',
          hotSwappable: false,
          keycaps: 'Stitched Edges',
          connectivity: 'N/A'
        }
      },
      {
        title: 'Apex Grip Sleeves',
        description: 'Pre-cut sweat-absorbent adhesive grip tapes designed for gamepads and high-performance mice, improving mouse control and ergonomics.',
        price: 14.99,
        category: accId,
        brand: 'PixelGear',
        stock: 45,
        images: ['https://images.unsplash.com/photo-1600861195091-690c92f1d2cc?q=80&w=600&auto=format&fit=crop'],
        specifications: {
          switchType: 'Polyester-Polyurethane Blend',
          layout: 'Self-Adhesive Grips',
          hotSwappable: false,
          keycaps: 'Sweat-wicking grip texture',
          connectivity: 'N/A'
        }
      }
    ];

    const seededProducts = [];
    for (const prod of productsData) {
      const created = await Product.create(prod);
      seededProducts.push(created);
    }
    console.log('Products seeded successfully!');

    // Add some reviews
    const cyber65 = seededProducts.find(p => p.title === 'PixelGear Cyber65 Keyboard');
    const customer = await User.findOne({ email: 'customer@pixelgear.com' });

    const review = new Review({
      user: customer._id,
      product: cyber65._id,
      rating: 5,
      comment: 'Absolutely love the RGB underglow! Sounds extremely premium right out of the box. Highly recommended!'
    });
    await review.save();
    console.log('Default reviews seeded!');

    if (shouldCloseConn) {
      mongoose.connection.close();
      console.log('Seeding complete. Connection closed.');
    }
  } catch (error) {
    console.error('Seeding error: ', error);
    if (shouldCloseConn) {
      process.exit(1);
    } else {
      throw error;
    }
  }
};

module.exports = seedData;

if (require.main === module) {
  seedData(true);
}
