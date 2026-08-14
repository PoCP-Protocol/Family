-- 榜样教育课件 seed(由 build_seed_sql.py 从课件 YAML 生成;幂等 ON CONFLICT DO NOTHING)
-- 依赖迁移 0001-0004。Legacy semantics only,非 Family canonical。content_ref 指向 content/courseware/*.yaml

-- ===== PARENT_21D_V1 (parent_21day_camp.yaml) =====
INSERT INTO fels.legacy_training_camps(training_camp_id,camp_code,title,duration_days,status,semantic_classification,created_at)
VALUES ('camp_PARENT_21D_V1','PARENT_21D_V1','21天家长训练营 · 先连接再纠正',21,'ACTIVE','LEGACY_PROGRAM_NOT_JOURNEY',now()) ON CONFLICT (training_camp_id) DO NOTHING;
INSERT INTO fels.legacy_program_phases(program_phase_id,training_camp_id,phase_code,phase_title,day_from,day_to,semantic_classification,created_at)
VALUES ('phase_PARENT_21D_V1_SEE_CONNECT','camp_PARENT_21D_V1','SEE_CONNECT','看见与连接',1,7,'LEGACY_PHASE_NOT_GROWTH_STAGE',now()) ON CONFLICT (program_phase_id) DO NOTHING;
INSERT INTO fels.legacy_program_phases(program_phase_id,training_camp_id,phase_code,phase_title,day_from,day_to,semantic_classification,created_at)
VALUES ('phase_PARENT_21D_V1_PARENT_FIRST','camp_PARENT_21D_V1','PARENT_FIRST','家长先改变',8,14,'LEGACY_PHASE_NOT_GROWTH_STAGE',now()) ON CONFLICT (program_phase_id) DO NOTHING;
INSERT INTO fels.legacy_program_phases(program_phase_id,training_camp_id,phase_code,phase_title,day_from,day_to,semantic_classification,created_at)
VALUES ('phase_PARENT_21D_V1_CO_STABILIZE','camp_PARENT_21D_V1','CO_STABILIZE','共创与稳定',15,21,'LEGACY_PHASE_NOT_GROWTH_STAGE',now()) ON CONFLICT (program_phase_id) DO NOTHING;
INSERT INTO fels.legacy_daily_tasks(daily_task_id,training_camp_id,day_index,title,instruction_text,content_ref,semantic_classification,created_at)
VALUES ('task_PARENT_21D_V1_D1','camp_PARENT_21D_V1',1,'先看见自己的第一反应','今天和孩子有摩擦时,先在心里说一句"我现在有点急",不马上开口。','PARENT_21D_V1#D1','LEGACY_TASK_NOT_GROWTH_ACTION',now()) ON CONFLICT (daily_task_id) DO NOTHING;
INSERT INTO fels.legacy_daily_tasks(daily_task_id,training_camp_id,day_index,title,instruction_text,content_ref,semantic_classification,created_at)
VALUES ('task_PARENT_21D_V1_D2','camp_PARENT_21D_V1',2,'开口前的三秒暂停','想批评前,先深呼吸数三秒再说第一句话。','PARENT_21D_V1#D2','LEGACY_TASK_NOT_GROWTH_ACTION',now()) ON CONFLICT (daily_task_id) DO NOTHING;
INSERT INTO fels.legacy_daily_tasks(daily_task_id,training_camp_id,day_index,title,instruction_text,content_ref,semantic_classification,created_at)
VALUES ('task_PARENT_21D_V1_D3','camp_PARENT_21D_V1',3,'接住情绪,而非先评判','把"你怎么又这样"换成"你看起来挺不开心的"。','PARENT_21D_V1#D3','LEGACY_TASK_NOT_GROWTH_ACTION',now()) ON CONFLICT (daily_task_id) DO NOTHING;
INSERT INTO fels.legacy_daily_tasks(daily_task_id,training_camp_id,day_index,title,instruction_text,content_ref,semantic_classification,created_at)
VALUES ('task_PARENT_21D_V1_D4','camp_PARENT_21D_V1',4,'先复述一句','回应前,先用自己的话复述一遍孩子在意的点。','PARENT_21D_V1#D4','LEGACY_TASK_NOT_GROWTH_ACTION',now()) ON CONFLICT (daily_task_id) DO NOTHING;
INSERT INTO fels.legacy_daily_tasks(daily_task_id,training_camp_id,day_index,title,instruction_text,content_ref,semantic_classification,created_at)
VALUES ('task_PARENT_21D_V1_D5','camp_PARENT_21D_V1',5,'少用"但是"','今天刻意不用"但是",改用"我看到…我有点担心…"。','PARENT_21D_V1#D5','LEGACY_TASK_NOT_GROWTH_ACTION',now()) ON CONFLICT (daily_task_id) DO NOTHING;
INSERT INTO fels.legacy_daily_tasks(daily_task_id,training_camp_id,day_index,title,instruction_text,content_ref,semantic_classification,created_at)
VALUES ('task_PARENT_21D_V1_D6','camp_PARENT_21D_V1',6,'用好奇代替追问','把"为什么没做完"换成"今天卡在哪一步了?"','PARENT_21D_V1#D6','LEGACY_TASK_NOT_GROWTH_ACTION',now()) ON CONFLICT (daily_task_id) DO NOTHING;
INSERT INTO fels.legacy_daily_tasks(daily_task_id,training_camp_id,day_index,title,instruction_text,content_ref,semantic_classification,created_at)
VALUES ('task_PARENT_21D_V1_D7','camp_PARENT_21D_V1',7,'第一周小复盘','回想这一周,记下一次"我先接住了情绪"的时刻。','PARENT_21D_V1#D7','LEGACY_TASK_NOT_GROWTH_ACTION',now()) ON CONFLICT (daily_task_id) DO NOTHING;
INSERT INTO fels.legacy_daily_tasks(daily_task_id,training_camp_id,day_index,title,instruction_text,content_ref,semantic_classification,created_at)
VALUES ('task_PARENT_21D_V1_D8','camp_PARENT_21D_V1',8,'帮情绪起个名字','猜一猜孩子的情绪并说出来:"你是不是有点失望?"','PARENT_21D_V1#D8','LEGACY_TASK_NOT_GROWTH_ACTION',now()) ON CONFLICT (daily_task_id) DO NOTHING;
INSERT INTO fels.legacy_daily_tasks(daily_task_id,training_camp_id,day_index,title,instruction_text,content_ref,semantic_classification,created_at)
VALUES ('task_PARENT_21D_V1_D9','camp_PARENT_21D_V1',9,'示范如何平复','情绪上来时,出声示范:"我先喝口水冷静一下。"','PARENT_21D_V1#D9','LEGACY_TASK_NOT_GROWTH_ACTION',now()) ON CONFLICT (daily_task_id) DO NOTHING;
INSERT INTO fels.legacy_daily_tasks(daily_task_id,training_camp_id,day_index,title,instruction_text,content_ref,semantic_classification,created_at)
VALUES ('task_PARENT_21D_V1_D10','camp_PARENT_21D_V1',10,'给有限选择','把命令换成两个都可接受的选择让孩子选。','PARENT_21D_V1#D10','LEGACY_TASK_NOT_GROWTH_ACTION',now()) ON CONFLICT (daily_task_id) DO NOTHING;
INSERT INTO fels.legacy_daily_tasks(daily_task_id,training_camp_id,day_index,title,instruction_text,content_ref,semantic_classification,created_at)
VALUES ('task_PARENT_21D_V1_D11','camp_PARENT_21D_V1',11,'把"应该"换成"这个阶段可以先"','挑一个你常说"应该"的点,改成一个更小的当下目标。','PARENT_21D_V1#D11','LEGACY_TASK_NOT_GROWTH_ACTION',now()) ON CONFLICT (daily_task_id) DO NOTHING;
INSERT INTO fels.legacy_daily_tasks(daily_task_id,training_camp_id,day_index,title,instruction_text,content_ref,semantic_classification,created_at)
VALUES ('task_PARENT_21D_V1_D12','camp_PARENT_21D_V1',12,'温和而坚定','选一个小边界,温和地说明并坚定守住一次。','PARENT_21D_V1#D12','LEGACY_TASK_NOT_GROWTH_ACTION',now()) ON CONFLICT (daily_task_id) DO NOTHING;
INSERT INTO fels.legacy_daily_tasks(daily_task_id,training_camp_id,day_index,title,instruction_text,content_ref,semantic_classification,created_at)
VALUES ('task_PARENT_21D_V1_D13','camp_PARENT_21D_V1',13,'说到做到','守住一个昨天说过的小约定,不临时改。','PARENT_21D_V1#D13','LEGACY_TASK_NOT_GROWTH_ACTION',now()) ON CONFLICT (daily_task_id) DO NOTHING;
INSERT INTO fels.legacy_daily_tasks(daily_task_id,training_camp_id,day_index,title,instruction_text,content_ref,semantic_classification,created_at)
VALUES ('task_PARENT_21D_V1_D14','camp_PARENT_21D_V1',14,'第二周小复盘','记下一个你自己坚持了的新习惯。','PARENT_21D_V1#D14','LEGACY_TASK_NOT_GROWTH_ACTION',now()) ON CONFLICT (daily_task_id) DO NOTHING;
INSERT INTO fels.legacy_daily_tasks(daily_task_id,training_camp_id,day_index,title,instruction_text,content_ref,semantic_classification,created_at)
VALUES ('task_PARENT_21D_V1_D15','camp_PARENT_21D_V1',15,'邀请孩子共创一条规则','就一件小事,和孩子一起定一条双方同意的规则。','PARENT_21D_V1#D15','LEGACY_TASK_NOT_GROWTH_ACTION',now()) ON CONFLICT (daily_task_id) DO NOTHING;
INSERT INTO fels.legacy_daily_tasks(daily_task_id,training_camp_id,day_index,title,instruction_text,content_ref,semantic_classification,created_at)
VALUES ('task_PARENT_21D_V1_D16','camp_PARENT_21D_V1',16,'做一次简单修复','为上次没忍住的时刻,向孩子简单道个歉。','PARENT_21D_V1#D16','LEGACY_TASK_NOT_GROWTH_ACTION',now()) ON CONFLICT (daily_task_id) DO NOTHING;
INSERT INTO fels.legacy_daily_tasks(daily_task_id,training_camp_id,day_index,title,instruction_text,content_ref,semantic_classification,created_at)
VALUES ('task_PARENT_21D_V1_D17','camp_PARENT_21D_V1',17,'具体地肯定一个小进步','指出一个具体的小进步:"你今天主动开始写作业了。"','PARENT_21D_V1#D17','LEGACY_TASK_NOT_GROWTH_ACTION',now()) ON CONFLICT (daily_task_id) DO NOTHING;
INSERT INTO fels.legacy_daily_tasks(daily_task_id,training_camp_id,day_index,title,instruction_text,content_ref,semantic_classification,created_at)
VALUES ('task_PARENT_21D_V1_D18','camp_PARENT_21D_V1',18,'迁移到新场景','把本周一个有效的小做法,用到另一件事上。','PARENT_21D_V1#D18','LEGACY_TASK_NOT_GROWTH_ACTION',now()) ON CONFLICT (daily_task_id) DO NOTHING;
INSERT INTO fels.legacy_daily_tasks(daily_task_id,training_camp_id,day_index,title,instruction_text,content_ref,semantic_classification,created_at)
VALUES ('task_PARENT_21D_V1_D19','camp_PARENT_21D_V1',19,'反复时不否定','孩子退步时,先接住情绪,不说"你又……"。','PARENT_21D_V1#D19','LEGACY_TASK_NOT_GROWTH_ACTION',now()) ON CONFLICT (daily_task_id) DO NOTHING;
INSERT INTO fels.legacy_daily_tasks(daily_task_id,training_camp_id,day_index,title,instruction_text,content_ref,semantic_classification,created_at)
VALUES ('task_PARENT_21D_V1_D20','camp_PARENT_21D_V1',20,'建立一个每日连接小仪式','和孩子约定一个每天 3 分钟的固定连接时刻(如睡前聊一句)。','PARENT_21D_V1#D20','LEGACY_TASK_NOT_GROWTH_ACTION',now()) ON CONFLICT (daily_task_id) DO NOTHING;
INSERT INTO fels.legacy_daily_tasks(daily_task_id,training_camp_id,day_index,title,instruction_text,content_ref,semantic_classification,created_at)
VALUES ('task_PARENT_21D_V1_D21','camp_PARENT_21D_V1',21,'综合复盘与下一步','回看 21 天,选一个你要继续保持的小习惯。','PARENT_21D_V1#D21','LEGACY_TASK_NOT_GROWTH_ACTION',now()) ON CONFLICT (daily_task_id) DO NOTHING;

-- ===== FAMILY_90D_V1 (family_90day_program.yaml) =====
INSERT INTO fels.legacy_training_camps(training_camp_id,camp_code,title,duration_days,status,semantic_classification,created_at)
VALUES ('camp_FAMILY_90D_V1','FAMILY_90D_V1','90天家庭成长计划 · 从家长先改变到共创稳定',90,'ACTIVE','LEGACY_PROGRAM_NOT_JOURNEY',now()) ON CONFLICT (training_camp_id) DO NOTHING;
INSERT INTO fels.legacy_program_phases(program_phase_id,training_camp_id,phase_code,phase_title,day_from,day_to,semantic_classification,created_at)
VALUES ('phase_FAMILY_90D_V1_SEE','camp_FAMILY_90D_V1','SEE','看见与连接',1,14,'LEGACY_PHASE_NOT_GROWTH_STAGE',now()) ON CONFLICT (program_phase_id) DO NOTHING;
INSERT INTO fels.legacy_program_phases(program_phase_id,training_camp_id,phase_code,phase_title,day_from,day_to,semantic_classification,created_at)
VALUES ('phase_FAMILY_90D_V1_PARENT_FIRST','camp_FAMILY_90D_V1','PARENT_FIRST','家长先改变',15,35,'LEGACY_PHASE_NOT_GROWTH_STAGE',now()) ON CONFLICT (program_phase_id) DO NOTHING;
INSERT INTO fels.legacy_program_phases(program_phase_id,training_camp_id,phase_code,phase_title,day_from,day_to,semantic_classification,created_at)
VALUES ('phase_FAMILY_90D_V1_CO_CREATE','camp_FAMILY_90D_V1','CO_CREATE','共创家庭',36,60,'LEGACY_PHASE_NOT_GROWTH_STAGE',now()) ON CONFLICT (program_phase_id) DO NOTHING;
INSERT INTO fels.legacy_program_phases(program_phase_id,training_camp_id,phase_code,phase_title,day_from,day_to,semantic_classification,created_at)
VALUES ('phase_FAMILY_90D_V1_STABILIZE','camp_FAMILY_90D_V1','STABILIZE','稳定与沉淀',61,90,'LEGACY_PHASE_NOT_GROWTH_STAGE',now()) ON CONFLICT (program_phase_id) DO NOTHING;
INSERT INTO fels.legacy_daily_tasks(daily_task_id,training_camp_id,day_index,title,instruction_text,content_ref,semantic_classification,created_at)
VALUES ('task_FAMILY_90D_V1_W1','camp_FAMILY_90D_V1',1,'先看见自己的第一反应','这一周只做一件事——在冲突升起时先看见自己的身体信号和第一反应,先不开口纠正。','FAMILY_90D_V1#W1','LEGACY_TASK_NOT_GROWTH_ACTION',now()) ON CONFLICT (daily_task_id) DO NOTHING;
INSERT INTO fels.legacy_daily_tasks(daily_task_id,training_camp_id,day_index,title,instruction_text,content_ref,semantic_classification,created_at)
VALUES ('task_FAMILY_90D_V1_W2','camp_FAMILY_90D_V1',8,'接住情绪,先复述再回应','把评判换成接住;回应前先用自己的话复述一遍孩子在意的点。','FAMILY_90D_V1#W2','LEGACY_TASK_NOT_GROWTH_ACTION',now()) ON CONFLICT (daily_task_id) DO NOTHING;
INSERT INTO fels.legacy_daily_tasks(daily_task_id,training_camp_id,day_index,title,instruction_text,content_ref,semantic_classification,created_at)
VALUES ('task_FAMILY_90D_V1_W3','camp_FAMILY_90D_V1',15,'帮情绪起个名字,并示范如何平复','先帮孩子的情绪起个名字,再用自己出声的平复动作做示范。','FAMILY_90D_V1#W3','LEGACY_TASK_NOT_GROWTH_ACTION',now()) ON CONFLICT (daily_task_id) DO NOTHING;
INSERT INTO fels.legacy_daily_tasks(daily_task_id,training_camp_id,day_index,title,instruction_text,content_ref,semantic_classification,created_at)
VALUES ('task_FAMILY_90D_V1_W4','camp_FAMILY_90D_V1',22,'给有限选择,支持自主','把命令换成两个你都能接受的选择,让孩子来定。','FAMILY_90D_V1#W4','LEGACY_TASK_NOT_GROWTH_ACTION',now()) ON CONFLICT (daily_task_id) DO NOTHING;
INSERT INTO fels.legacy_daily_tasks(daily_task_id,training_camp_id,day_index,title,instruction_text,content_ref,semantic_classification,created_at)
VALUES ('task_FAMILY_90D_V1_W5','camp_FAMILY_90D_V1',29,'期待校准与边界一致','把一个"应该"改成"这个阶段可以先……",再温和坚定地守住一个小边界。','FAMILY_90D_V1#W5','LEGACY_TASK_NOT_GROWTH_ACTION',now()) ON CONFLICT (daily_task_id) DO NOTHING;
INSERT INTO fels.legacy_daily_tasks(daily_task_id,training_camp_id,day_index,title,instruction_text,content_ref,semantic_classification,created_at)
VALUES ('task_FAMILY_90D_V1_W6','camp_FAMILY_90D_V1',36,'邀请孩子共创一条家庭规则','就一件具体小事,和孩子一起定一条双方都同意的规则。','FAMILY_90D_V1#W6','LEGACY_TASK_NOT_GROWTH_ACTION',now()) ON CONFLICT (daily_task_id) DO NOTHING;
INSERT INTO fels.legacy_daily_tasks(daily_task_id,training_camp_id,day_index,title,instruction_text,content_ref,semantic_classification,created_at)
VALUES ('task_FAMILY_90D_V1_W7','camp_FAMILY_90D_V1',43,'修复先于说教','为上次没忍住的时刻主动修复,而不是继续讲道理。','FAMILY_90D_V1#W7','LEGACY_TASK_NOT_GROWTH_ACTION',now()) ON CONFLICT (daily_task_id) DO NOTHING;
INSERT INTO fels.legacy_daily_tasks(daily_task_id,training_camp_id,day_index,title,instruction_text,content_ref,semantic_classification,created_at)
VALUES ('task_FAMILY_90D_V1_W8','camp_FAMILY_90D_V1',50,'放大具体的小赢','每天找到并具体说出一个孩子做到的小进步。','FAMILY_90D_V1#W8','LEGACY_TASK_NOT_GROWTH_ACTION',now()) ON CONFLICT (daily_task_id) DO NOTHING;
INSERT INTO fels.legacy_daily_tasks(daily_task_id,training_camp_id,day_index,title,instruction_text,content_ref,semantic_classification,created_at)
VALUES ('task_FAMILY_90D_V1_W9','camp_FAMILY_90D_V1',56,'迁移到新场景','把本阶段一个有效的小做法,试着用到另一件事上。','FAMILY_90D_V1#W9','LEGACY_TASK_NOT_GROWTH_ACTION',now()) ON CONFLICT (daily_task_id) DO NOTHING;
INSERT INTO fels.legacy_daily_tasks(daily_task_id,training_camp_id,day_index,title,instruction_text,content_ref,semantic_classification,created_at)
VALUES ('task_FAMILY_90D_V1_W10','camp_FAMILY_90D_V1',61,'处理反复,不否定','孩子出现反复时,先接住情绪,不说"你又……"。','FAMILY_90D_V1#W10','LEGACY_TASK_NOT_GROWTH_ACTION',now()) ON CONFLICT (daily_task_id) DO NOTHING;
INSERT INTO fels.legacy_daily_tasks(daily_task_id,training_camp_id,day_index,title,instruction_text,content_ref,semantic_classification,created_at)
VALUES ('task_FAMILY_90D_V1_W11','camp_FAMILY_90D_V1',68,'每日连接的小仪式','和孩子约定一个每天几分钟的固定连接时刻,并坚持下来。','FAMILY_90D_V1#W11','LEGACY_TASK_NOT_GROWTH_ACTION',now()) ON CONFLICT (daily_task_id) DO NOTHING;
INSERT INTO fels.legacy_daily_tasks(daily_task_id,training_camp_id,day_index,title,instruction_text,content_ref,semantic_classification,created_at)
VALUES ('task_FAMILY_90D_V1_W12','camp_FAMILY_90D_V1',75,'跨场景稳定','把前几周稳定下来的做法,带到吃饭/出门/作业等更多场景。','FAMILY_90D_V1#W12','LEGACY_TASK_NOT_GROWTH_ACTION',now()) ON CONFLICT (daily_task_id) DO NOTHING;
INSERT INTO fels.legacy_daily_tasks(daily_task_id,training_camp_id,day_index,title,instruction_text,content_ref,semantic_classification,created_at)
VALUES ('task_FAMILY_90D_V1_W13','camp_FAMILY_90D_V1',83,'综合复盘,衔接年度会员','回看 90 天,挑出真实发生的过程改变,选定要继续保持的家庭习惯。','FAMILY_90D_V1#W13','LEGACY_TASK_NOT_GROWTH_ACTION',now()) ON CONFLICT (daily_task_id) DO NOTHING;
