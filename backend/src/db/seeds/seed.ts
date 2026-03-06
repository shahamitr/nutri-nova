import { getPool, closePool } from '../connection';
import bcrypt from 'bcrypt';
import speakeasy from 'speakeasy';

async function seed() {
  const pool = getPool();

  console.log('🌱 Seeding database...');

  try {
    // Create test user
    const password = 'Test@1234';
    const passwordHash = await bcrypt.hash(password, 12);
    const totpSecret = speakeasy.generateSecret({ length: 32 });

    const [userResult] = await pool.execute<any>(
      `INSERT INTO users (name, email, password_hash, totp_secret)
       VALUES (?, ?, ?, ?)`,
      ['Test User', 'test@nutrivoice.ai', passwordHash, totpSecret.base32]
    );

    const userId = userResult.insertId;
    console.log(`✅ Created test user (ID: ${userId})`);
    console.log(`   Email: test@nutrivoice.ai`);
    console.log(`   Password: ${password}`);
    console.log(`   TOTP Secret: ${totpSecret.base32}`);

    // Create voice settings
    await pool.execute(
      `INSERT INTO voice_settings (user_id, accent, voice_gender, speech_speed)
       VALUES (?, ?, ?, ?)`,
      [userId, 'US_ENGLISH', 'MALE', 1.0]
    );
    console.log('✅ Created voice settings');

    // Create health profile
    await pool.execute(
      `INSERT INTO health_profile
       (user_id, age, gender, height_cm, weight_kg, diet_preference, activity_level, sleep_hours, stress_level)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, 30, 'MALE', 175, 75, 'VEGETARIAN', 'MODERATE', 7.5, 'MODERATE']
    );
    console.log('✅ Created health profile');

    // Calculate and store BMI
    const bmi = 75 / Math.pow(1.75, 2);
    const category = bmi < 18.5 ? 'UNDERWEIGHT' : bmi < 25 ? 'NORMAL' : bmi < 30 ? 'OVERWEIGHT' : 'OBESE';

    await pool.execute(
      `INSERT INTO bmi_records (user_id, bmi_value, category)
       VALUES (?, ?, ?)`,
      [userId, bmi.toFixed(2), category]
    );
    console.log(`✅ Created BMI record (${bmi.toFixed(2)} - ${category})`);

    // Create sample diet plan
    const breakfast = {
      name: 'Breakfast',
      items: [
        { name: 'Oats with almonds', portion: '1 bowl', calories: 300 },
        { name: 'Banana', portion: '1 medium', calories: 105 },
        { name: 'Green tea', portion: '1 cup', calories: 0 },
      ],
      total_calories: 405,
    };

    const lunch = {
      name: 'Lunch',
      items: [
        { name: 'Chapati', portion: '2 pieces', calories: 240 },
        { name: 'Dal', portion: '1 bowl', calories: 180 },
        { name: 'Paneer sabji', portion: '1 bowl', calories: 250 },
        { name: 'Salad', portion: '1 plate', calories: 50 },
      ],
      total_calories: 720,
    };

    const snack = {
      name: 'Evening Snack',
      items: [
        { name: 'Mixed nuts', portion: '30g', calories: 170 },
        { name: 'Apple', portion: '1 medium', calories: 95 },
      ],
      total_calories: 265,
    };

    const dinner = {
      name: 'Dinner',
      items: [
        { name: 'Vegetable curry', portion: '1 bowl', calories: 200 },
        { name: 'Curd', portion: '1 bowl', calories: 100 },
        { name: 'Chapati', portion: '2 pieces', calories: 240 },
      ],
      total_calories: 540,
    };

    await pool.execute(
      `INSERT INTO diet_plans
       (user_id, daily_calories, protein_percentage, carbs_percentage, fats_percentage, breakfast, lunch, snack, dinner)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        1930,
        25.0,
        50.0,
        25.0,
        JSON.stringify(breakfast),
        JSON.stringify(lunch),
        JSON.stringify(snack),
        JSON.stringify(dinner),
      ]
    );
    console.log('✅ Created diet plan');

    // Create user progress
    await pool.execute(
      `INSERT INTO user_progress
       (user_id, profile_completed, bmi_calculated, routine_completed, diet_generated, points, badges)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        true,
        true,
        true,
        true,
        130,
        JSON.stringify([
          'Health Profile Created',
          'Health Baseline Ready',
          'Lifestyle Analysis Complete',
          'Personalized Diet Ready',
        ]),
      ]
    );
    console.log('✅ Created user progress (130 points, 4 badges)');

    console.log('\n✨ Database seeded successfully!');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  } finally {
    await closePool();
  }
}

seed();
