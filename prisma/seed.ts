/**
 * Prisma Seed Script
 * デフォルトスキーマとロールの初期データを投入
 *
 * 実行方法:
 * npm run db:seed
 *
 * 参照:
 * - docs/仕様書作成支援アプリ機能仕様書.md
 * - docs/仕様書作成アプリ データモデル生成.md
 */

import { PrismaClient, FieldDataType, RoleName } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ============================================================================
  // 1. ロールの作成
  // ============================================================================
  console.log('📋 Creating roles...');

  const administratorRole = await prisma.role.upsert({
    where: { role_name: RoleName.administrator },
    update: {},
    create: {
      role_name: RoleName.administrator,
    },
  });

  const creatorRole = await prisma.role.upsert({
    where: { role_name: RoleName.creator },
    update: {},
    create: {
      role_name: RoleName.creator,
    },
  });

  console.log(`✅ Created roles: ${administratorRole.role_name}, ${creatorRole.role_name}`);

  // ============================================================================
  // 2. デフォルトスキーマの作成
  // ============================================================================
  console.log('📋 Creating default schema...');

  const defaultSchema = await prisma.schema.upsert({
    where: { schema_id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      schema_id: '00000000-0000-0000-0000-000000000001',
      schema_name: 'デフォルトスキーマ',
      is_default: true,
    },
  });

  console.log(`✅ Created schema: ${defaultSchema.schema_name}`);

  // ============================================================================
  // 3. カテゴリ（ウィザードステップ）の作成
  // ============================================================================
  console.log('📋 Creating schema categories...');

  const categories = [
    {
      category_id: '00000000-0000-0000-0000-000000000101',
      schema_id: defaultSchema.schema_id,
      category_name: '基本情報',
      description: '仕様書の件名、背景、目的を入力します',
      display_order: 1,
    },
    {
      category_id: '00000000-0000-0000-0000-000000000102',
      schema_id: defaultSchema.schema_id,
      category_name: '調達の種別とスコープ',
      description: '調達の種別と実施範囲を選択します',
      display_order: 2,
    },
    {
      category_id: '00000000-0000-0000-0000-000000000103',
      schema_id: defaultSchema.schema_id,
      category_name: '納品情報',
      description: '納品期限、場所、担当者、納品物を定義します',
      display_order: 3,
    },
    {
      category_id: '00000000-0000-0000-0000-000000000104',
      schema_id: defaultSchema.schema_id,
      category_name: '受注者等の要件',
      description: '受注者要件と業務基本要件を定義します',
      display_order: 4,
    },
    {
      category_id: '00000000-0000-0000-0000-000000000105',
      schema_id: defaultSchema.schema_id,
      category_name: '各業務の詳細仕様',
      description: '個別の業務タスクと詳細仕様を定義します',
      display_order: 5,
    },
  ];

  for (const category of categories) {
    await prisma.schemaCategory.upsert({
      where: { category_id: category.category_id },
      update: {},
      create: category,
    });
  }

  console.log(`✅ Created ${categories.length} categories`);

  // ============================================================================
  // 4. フィールド（入力項目）の作成
  // ============================================================================
  console.log('📋 Creating schema fields...');

  const fields = [
    // ========== ステップ1: 基本情報 ==========
    {
      field_id: '00000000-0000-0000-0000-000000001001',
      category_id: '00000000-0000-0000-0000-000000000101',
      field_name: '件名',
      data_type: FieldDataType.text,
      is_required: true,
      options: null,
      placeholder_text: '仕様書の件名を入力してください（例：XXシステム開発調達）',
      list_target_entity: null,
      display_order: 1,
    },
    {
      field_id: '00000000-0000-0000-0000-000000001002',
      category_id: '00000000-0000-0000-0000-000000000101',
      field_name: '背景',
      data_type: FieldDataType.textarea,
      is_required: true,
      options: null,
      placeholder_text: '調達の背景や経緯を入力してください',
      list_target_entity: null,
      display_order: 2,
    },
    {
      field_id: '00000000-0000-0000-0000-000000001003',
      category_id: '00000000-0000-0000-0000-000000000101',
      field_name: '調達の目的',
      data_type: FieldDataType.textarea,
      is_required: true,
      options: null,
      placeholder_text: '調達の目的を入力してください',
      list_target_entity: null,
      display_order: 3,
    },

    // ========== ステップ2: 調達の種別とスコープ ==========
    {
      field_id: '00000000-0000-0000-0000-000000002001',
      category_id: '00000000-0000-0000-0000-000000000102',
      field_name: '調達の種別',
      data_type: FieldDataType.radio,
      is_required: true,
      options: {
        choices: [
          { value: 'system_development', label: 'システム開発' },
          { value: 'system_maintenance', label: 'システム保守' },
          { value: 'consulting', label: 'コンサルティング' },
          { value: 'equipment', label: '機器調達' },
          { value: 'other', label: 'その他' },
        ],
      },
      placeholder_text: null,
      list_target_entity: null,
      display_order: 1,
    },
    {
      field_id: '00000000-0000-0000-0000-000000002002',
      category_id: '00000000-0000-0000-0000-000000000102',
      field_name: '調達のスコープ',
      data_type: FieldDataType.checkbox,
      is_required: false,
      options: {
        choices: [
          { value: 'requirement_definition', label: '要件定義' },
          { value: 'basic_design', label: '基本設計' },
          { value: 'detailed_design', label: '詳細設計' },
          { value: 'implementation', label: '実装・開発' },
          { value: 'testing', label: 'テスト' },
          { value: 'deployment', label: 'リリース・導入' },
          { value: 'operation', label: '運用・保守' },
        ],
      },
      placeholder_text: null,
      list_target_entity: null,
      display_order: 2,
    },

    // ========== ステップ3: 納品情報 ==========
    {
      field_id: '00000000-0000-0000-0000-000000003001',
      category_id: '00000000-0000-0000-0000-000000000103',
      field_name: '納品期限',
      data_type: FieldDataType.date,
      is_required: true,
      options: null,
      placeholder_text: null,
      list_target_entity: null,
      display_order: 1,
    },
    {
      field_id: '00000000-0000-0000-0000-000000003002',
      category_id: '00000000-0000-0000-0000-000000000103',
      field_name: '納品場所',
      data_type: FieldDataType.text,
      is_required: false,
      options: null,
      placeholder_text: '納品場所を入力してください（例：本社3階会議室）',
      list_target_entity: null,
      display_order: 2,
    },
    {
      field_id: '00000000-0000-0000-0000-000000003003',
      category_id: '00000000-0000-0000-0000-000000000103',
      field_name: '納品担当者',
      data_type: FieldDataType.text,
      is_required: false,
      options: null,
      placeholder_text: '納品担当者名を入力してください',
      list_target_entity: null,
      display_order: 3,
    },
    {
      field_id: '00000000-0000-0000-0000-000000003004',
      category_id: '00000000-0000-0000-0000-000000000103',
      field_name: '納品物',
      data_type: FieldDataType.list,
      is_required: true,
      options: null,
      placeholder_text: null,
      list_target_entity: 'Deliverable',
      display_order: 4,
    },

    // ========== ステップ4: 受注者等の要件 ==========
    {
      field_id: '00000000-0000-0000-0000-000000004001',
      category_id: '00000000-0000-0000-0000-000000000104',
      field_name: '受注者要件',
      data_type: FieldDataType.list,
      is_required: false,
      options: null,
      placeholder_text: null,
      list_target_entity: 'ContractorRequirement',
      display_order: 1,
    },
    {
      field_id: '00000000-0000-0000-0000-000000004002',
      category_id: '00000000-0000-0000-0000-000000000104',
      field_name: '業務基本要件',
      data_type: FieldDataType.list,
      is_required: false,
      options: null,
      placeholder_text: null,
      list_target_entity: 'BasicBusinessRequirement',
      display_order: 2,
    },

    // ========== ステップ5: 各業務の詳細仕様 ==========
    {
      field_id: '00000000-0000-0000-0000-000000005001',
      category_id: '00000000-0000-0000-0000-000000000105',
      field_name: '業務タスク',
      data_type: FieldDataType.list,
      is_required: true,
      options: null,
      placeholder_text: null,
      list_target_entity: 'BusinessTask',
      display_order: 1,
    },
  ];

  for (const field of fields) {
    await prisma.schemaField.upsert({
      where: { field_id: field.field_id },
      update: {},
      create: field,
    });
  }

  console.log(`✅ Created ${fields.length} fields`);

  // ============================================================================
  // 5. テスト用ユーザーの作成（開発環境のみ）
  // ============================================================================
  if (process.env.NODE_ENV === 'development' || process.env.SEED_TEST_USERS === 'true') {
    console.log('👤 Creating test users...');

    // 注意: パスワードは実際の実装では bcrypt でハッシュ化する必要があります
    // ここでは説明のためプレーンテキストを使用していますが、本番では絶対に使用しないでください
    const adminUser = await prisma.user.upsert({
      where: { email: 'admin@example.com' },
      update: {},
      create: {
        email: 'admin@example.com',
        password_hash: 'PLACEHOLDER_HASH_admin123', // 本番では bcrypt.hash('admin123', 12)
        full_name: '管理者 太郎',
      },
    });

    await prisma.userRole.upsert({
      where: {
        user_id_role_id: {
          user_id: adminUser.user_id,
          role_id: administratorRole.role_id,
        },
      },
      update: {},
      create: {
        user_id: adminUser.user_id,
        role_id: administratorRole.role_id,
      },
    });

    const creatorUser = await prisma.user.upsert({
      where: { email: 'creator@example.com' },
      update: {},
      create: {
        email: 'creator@example.com',
        password_hash: 'PLACEHOLDER_HASH_creator123', // 本番では bcrypt.hash('creator123', 12)
        full_name: '作成者 花子',
      },
    });

    await prisma.userRole.upsert({
      where: {
        user_id_role_id: {
          user_id: creatorUser.user_id,
          role_id: creatorRole.role_id,
        },
      },
      update: {},
      create: {
        user_id: creatorUser.user_id,
        role_id: creatorRole.role_id,
      },
    });

    console.log('✅ Created test users:');
    console.log('  - admin@example.com (Administrator)');
    console.log('  - creator@example.com (Creator)');
    console.log('⚠️  WARNING: Test users have placeholder password hashes. Implement bcrypt before production!');
  }

  console.log('');
  console.log('🎉 Seeding completed successfully!');
  console.log('');
  console.log('Summary:');
  console.log(`  - ${2} roles`);
  console.log(`  - ${1} schema (デフォルトスキーマ)`);
  console.log(`  - ${categories.length} categories`);
  console.log(`  - ${fields.length} fields`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:');
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
