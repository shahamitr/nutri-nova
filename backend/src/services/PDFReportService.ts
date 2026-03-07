import { query } from '../db/connection';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

interface ConversationMessage {
  role: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

interface ReportOptions {
  includeConversation?: boolean;
  includeDietPlan?: boolean;
  includeHealthProfile?: boolean;
  includeRecommendations?: boolean;
  highlightConcerns?: boolean;
}

export class PDFReportService {
  private reportsDir = path.join(process.cwd(), 'reports');

  constructor() {
    // Ensure reports directory exists
    if (!fs.existsSync(this.reportsDir)) {
      fs.mkdirSync(this.reportsDir, { recursive: true });
    }
  }

  /**
   * Generate comprehensive health report PDF
   */
  async generateComprehensiveReport(
    userId: number,
    options: ReportOptions = {}
  ): Promise<{ filePath: string; fileSize: number }> {
    const {
      includeConversation = true,
      includeDietPlan = true,
      includeHealthProfile = true,
      includeRecommendations = true,
      highlightConcerns = true,
    } = options;

    // Create PDF document
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const fileName = `health_report_${userId}_${Date.now()}.pdf`;
    const filePath = path.join(this.reportsDir, fileName);
    const writeStream = fs.createWriteStream(filePath);

    doc.pipe(writeStream);

    // Add header
    this.addHeader(doc);

    // Add user info
    await this.addUserInfo(doc, userId);

    // Add health profile
    if (includeHealthProfile) {
      await this.addHealthProfile(doc, userId, highlightConcerns);
    }

    // Add diet plan
    if (includeDietPlan) {
      await this.addDietPlan(doc, userId);
    }

    // Add recommendations
    if (includeRecommendations) {
      await this.addRecommendations(doc, userId);
    }

    // Add conversation history
    if (includeConversation) {
      await this.addConversationHistory(doc, userId);
    }

    // Add footer
    this.addFooter(doc);

    // Finalize PDF
    doc.end();

    // Wait for file to be written
    await new Promise((resolve, reject) => {
      writeStream.on('finish', resolve);
      writeStream.on('error', reject);
    });

    // Get file size
    const stats = fs.statSync(filePath);

    // Store report record in database
    await query(
      'INSERT INTO health_reports (user_id, report_type, file_path, file_size) VALUES (?, ?, ?, ?)',
      [userId, 'COMPREHENSIVE', filePath, stats.size]
    );

    return { filePath, fileSize: stats.size };
  }

  /**
   * Add PDF header
   */
  private addHeader(doc: PDFKit.PDFDocument): void {
    doc
      .fontSize(24)
      .fillColor('#10b981')
      .text('NutriVoice AI', { align: 'center' })
      .fontSize(16)
      .fillColor('#6b7280')
      .text('Comprehensive Health & Nutrition Report', { align: 'center' })
      .moveDown()
      .fontSize(10)
      .fillColor('#9ca3af')
      .text(`Generated on: ${new Date().toLocaleDateString()}`, { align: 'center' })
      .moveDown(2);
  }

  /**
   * Add user information
   */
  private async addUserInfo(doc: PDFKit.PDFDocument, userId: number): Promise<void> {
    const users = await query<any[]>('SELECT name, email FROM users WHERE id = ?', [userId]);

    if (users.length > 0) {
      const user = users[0];
      doc
        .fontSize(12)
        .fillColor('#1f2937')
        .text(`Patient Name: ${user.name}`)
        .text(`Email: ${user.email}`)
        .moveDown();
    }
  }

  /**
   * Add health profile section
   */
  private async addHealthProfile(
    doc: PDFKit.PDFDocument,
    userId: number,
    highlightConcerns: boolean
  ): Promise<void> {
    const profiles = await query<any[]>('SELECT * FROM health_profile WHERE user_id = ?', [userId]);

    if (profiles.length === 0) return;

    const profile = profiles[0];

    doc
      .fontSize(16)
      .fillColor('#10b981')
      .text('Health Profile', { underline: true })
      .moveDown(0.5);

    // Basic metrics
    doc.fontSize(12).fillColor('#1f2937');

    const heightM = profile.height_cm / 100;
    const bmi = profile.weight_kg / (heightM * heightM);
    const bmiCategory = bmi < 18.5 ? 'Underweight' : bmi < 25 ? 'Normal' : bmi < 30 ? 'Overweight' : 'Obese';

    doc.text(`Age: ${profile.age} years`);
    doc.text(`Gender: ${profile.gender}`);
    doc.text(`Height: ${profile.height_cm} cm`);
    doc.text(`Weight: ${profile.weight_kg} kg`);

    // Highlight BMI if concerning
    if (highlightConcerns && (bmi < 18.5 || bmi >= 25)) {
      doc.fillColor('#ef4444').text(`BMI: ${bmi.toFixed(1)} (${bmiCategory}) ⚠️`, { continued: false });
      doc.fillColor('#1f2937');
    } else {
      doc.text(`BMI: ${bmi.toFixed(1)} (${bmiCategory})`);
    }

    doc.moveDown(0.5);

    // Lifestyle factors
    doc.text(`Activity Level: ${profile.activity_level || 'Not specified'}`);
    doc.text(`Sleep: ${profile.sleep_hours || 'Not specified'} hours/night`);
    doc.text(`Sleep Quality: ${profile.sleep_quality || 'Not specified'}`);
    doc.text(`Stress Level: ${profile.stress_level || 'Not specified'}`);
    doc.text(`Energy Levels: ${profile.energy_levels || 'Not specified'}`);
    doc.moveDown(0.5);

    // Health conditions and concerns
    if (profile.chronic_conditions) {
      doc.fillColor('#ef4444').text(`Chronic Conditions: ${profile.chronic_conditions} ⚠️`);
      doc.fillColor('#1f2937');
    }

    if (profile.medications) {
      doc.text(`Current Medications: ${profile.medications}`);
    }

    if (profile.allergies) {
      doc.fillColor('#f59e0b').text(`Allergies: ${profile.allergies} ⚠️`);
      doc.fillColor('#1f2937');
    }

    // Pain assessment
    const pains = [];
    if (profile.joint_pain) pains.push('Joint pain');
    if (profile.back_pain) pains.push('Back pain');
    if (profile.neck_pain) pains.push('Neck pain');

    if (pains.length > 0) {
      doc.fillColor('#f59e0b').text(`Pain Areas: ${pains.join(', ')} ⚠️`);
      if (profile.pain_details) {
        doc.text(`Details: ${profile.pain_details}`);
      }
      doc.fillColor('#1f2937');
    }

    // Habits
    if (profile.smoking_status && profile.smoking_status !== 'NON_SMOKER') {
      doc.fillColor('#ef4444').text(`Smoking: ${profile.smoking_status} ⚠️`);
      doc.fillColor('#1f2937');
    }

    if (profile.alcohol_consumption && profile.alcohol_consumption !== 'NONE') {
      doc.fillColor('#f59e0b').text(`Alcohol: ${profile.alcohol_consumption} ⚠️`);
      doc.fillColor('#1f2937');
    }

    if (profile.exercise_limitations) {
      doc.text(`Exercise Limitations: ${profile.exercise_limitations}`);
    }

    if (profile.digestive_issues) {
      doc.text(`Digestive Issues: ${profile.digestive_issues}`);
    }

    doc.moveDown(2);
  }

  /**
   * Add diet plan section
   */
  private async addDietPlan(doc: PDFKit.PDFDocument, userId: number): Promise<void> {
    const plans = await query<any[]>(
      'SELECT * FROM diet_plans WHERE user_id = ? ORDER BY created_at DESC LIMIT 1',
      [userId]
    );

    if (plans.length === 0) return;

    const plan = plans[0];

    doc
      .fontSize(16)
      .fillColor('#10b981')
      .text('Personalized Diet Plan', { underline: true })
      .moveDown(0.5);

    doc.fontSize(12).fillColor('#1f2937');
    doc.text(`Daily Calories: ${plan.daily_calories} kcal`);
    doc.text(
      `Macros: ${plan.protein_percentage}% Protein, ${plan.carbs_percentage}% Carbs, ${plan.fats_percentage}% Fats`
    );
    doc.moveDown();

    // Add meals
    const meals = [
      { key: 'breakfast', data: JSON.parse(plan.breakfast) },
      { key: 'lunch', data: JSON.parse(plan.lunch) },
      { key: 'dinner', data: JSON.parse(plan.dinner) },
    ];

    const snacks = JSON.parse(plan.snack || '{}');
    if (snacks.mid_morning) meals.splice(1, 0, { key: 'mid_morning', data: snacks.mid_morning });
    if (snacks.evening) meals.splice(3, 0, { key: 'evening', data: snacks.evening });
    if (snacks.before_bed) meals.push({ key: 'before_bed', data: snacks.before_bed });

    meals.forEach((meal) => {
      doc.fontSize(14).fillColor('#059669').text(meal.data.name);
      doc.fontSize(10).fillColor('#6b7280').text(meal.data.time || '');
      doc.fontSize(11).fillColor('#1f2937');

      if (meal.data.items && Array.isArray(meal.data.items)) {
        meal.data.items.forEach((item: any) => {
          doc.text(`  • ${item.name}`);
        });
      }

      doc.fontSize(10).fillColor('#6b7280');
      doc.text(`  Calories: ${meal.data.total_calories || 0} kcal`);
      doc.moveDown(0.5);
    });

    // Add water intake if available
    if (plan.water_intake) {
      const waterIntake = JSON.parse(plan.water_intake);
      doc.fontSize(14).fillColor('#059669').text('Water Intake Schedule');
      doc.fontSize(11).fillColor('#1f2937');
      doc.text(`Total: ${waterIntake.total_liters || 2.5}L per day`);
      if (waterIntake.note) {
        doc.fontSize(10).fillColor('#6b7280').text(waterIntake.note);
      }
      doc.moveDown();
    }

    doc.moveDown(2);
  }

  /**
   * Add recommendations section
   */
  private async addRecommendations(doc: PDFKit.PDFDocument, userId: number): Promise<void> {
    const plans = await query<any[]>(
      'SELECT recommendations, timeline FROM diet_plans WHERE user_id = ? ORDER BY created_at DESC LIMIT 1',
      [userId]
    );

    if (plans.length === 0 || !plans[0].recommendations) return;

    const recommendations = JSON.parse(plans[0].recommendations);

    doc
      .fontSize(16)
      .fillColor('#10b981')
      .text('Recommendations', { underline: true })
      .moveDown(0.5);

    const categories = [
      { key: 'exercise', title: 'Exercise' },
      { key: 'sleep', title: 'Sleep' },
      { key: 'stress_management', title: 'Stress Management' },
      { key: 'tracking', title: 'Progress Tracking' },
      { key: 'foods_to_limit', title: 'Foods to Limit' },
      { key: 'meal_timing', title: 'Meal Timing' },
    ];

    categories.forEach((category) => {
      if (recommendations[category.key] && Array.isArray(recommendations[category.key])) {
        doc.fontSize(14).fillColor('#059669').text(category.title);
        doc.fontSize(11).fillColor('#1f2937');

        recommendations[category.key].forEach((item: string) => {
          doc.text(`  • ${item}`);
        });

        doc.moveDown(0.5);
      }
    });

    // Add timeline if available
    if (plans[0].timeline) {
      const timeline = JSON.parse(plans[0].timeline);
      doc.fontSize(14).fillColor('#059669').text('12-Week Journey');
      doc.fontSize(11).fillColor('#1f2937');

      timeline.forEach((phase: any) => {
        doc.text(`${phase.weeks}: ${phase.phase}`);
        doc.fontSize(10).fillColor('#6b7280').text(`  ${phase.description}`);
        doc.fontSize(11).fillColor('#1f2937');
        doc.moveDown(0.3);
      });
    }

    doc.moveDown(2);
  }

  /**
   * Add conversation history section
   */
  private async addConversationHistory(doc: PDFKit.PDFDocument, userId: number): Promise<void> {
    const messages = await query<ConversationMessage[]>(
      'SELECT role, content, timestamp FROM conversation_history WHERE user_id = ? ORDER BY timestamp ASC LIMIT 100',
      [userId]
    );

    if (messages.length === 0) return;

    doc.addPage();

    doc
      .fontSize(16)
      .fillColor('#10b981')
      .text('Conversation History', { underline: true })
      .moveDown(0.5);

    messages.forEach((message) => {
      const roleColor = message.role === 'ai' ? '#059669' : '#3b82f6';
      const roleLabel = message.role === 'ai' ? 'AI Nutritionist' : 'You';

      doc.fontSize(11).fillColor(roleColor).text(roleLabel, { continued: true });
      doc
        .fontSize(9)
        .fillColor('#9ca3af')
        .text(` (${new Date(message.timestamp).toLocaleString()})`, { continued: false });

      doc.fontSize(10).fillColor('#1f2937').text(message.content, { indent: 10 });
      doc.moveDown(0.5);
    });
  }

  /**
   * Add footer
   */
  private addFooter(doc: PDFKit.PDFDocument): void {
    const bottomMargin = 50;
    doc
      .fontSize(8)
      .fillColor('#9ca3af')
      .text(
        'This report is generated by NutriVoice AI powered by Amazon Nova. Consult with a healthcare professional before making significant dietary or lifestyle changes.',
        50,
        doc.page.height - bottomMargin,
        { align: 'center', width: doc.page.width - 100 }
      );
  }

  /**
   * Get user reports
   */
  async getUserReports(userId: number): Promise<any[]> {
    return await query<any[]>(
      'SELECT id, report_type, file_path, file_size, generated_at FROM health_reports WHERE user_id = ? ORDER BY generated_at DESC',
      [userId]
    );
  }

  /**
   * Delete report
   */
  async deleteReport(reportId: number, userId: number): Promise<boolean> {
    const reports = await query<any[]>(
      'SELECT file_path FROM health_reports WHERE id = ? AND user_id = ?',
      [reportId, userId]
    );

    if (reports.length === 0) return false;

    const filePath = reports[0].file_path;

    // Delete file
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Delete database record
    await query('DELETE FROM health_reports WHERE id = ?', [reportId]);

    return true;
  }
}
