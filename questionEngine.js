const CATEGORY_RULES = {
  life: [
    ['人生', 4], ['未来', 3], ['方向', 3], ['生活', 3], ['迷茫', 3],
    ['改变', 2], ['成长', 2], ['意义', 2], ['目标', 2], ['状态', 1],
  ],
  love: [
    ['爱情', 5], ['感情', 5], ['喜欢', 4], ['爱', 3], ['恋爱', 5],
    ['对象', 4], ['男朋友', 5], ['女朋友', 5], ['前任', 5], ['复合', 5],
    ['暧昧', 5], ['约会', 4], ['表白', 5], ['结婚', 4], ['分手', 5],
    ['他', 1], ['她', 1],
  ],
  career: [
    ['工作', 5], ['事业', 5], ['职业', 5], ['公司', 4], ['老板', 4],
    ['同事', 3], ['升职', 5], ['加薪', 5], ['跳槽', 5], ['辞职', 5],
    ['面试', 5], ['项目', 3], ['客户', 4], ['创业', 5], ['offer', 5],
  ],
  wealth: [
    ['钱', 4], ['财富', 5], ['收入', 5], ['工资', 4], ['投资', 5],
    ['理财', 5], ['股票', 5], ['基金', 5], ['买房', 5], ['贷款', 5],
    ['预算', 4], ['花钱', 4], ['存钱', 5], ['赚钱', 5], ['生意', 4],
  ],
  family: [
    ['家人', 5], ['家庭', 5], ['父母', 5], ['爸爸', 5], ['妈妈', 5],
    ['孩子', 5], ['儿子', 5], ['女儿', 5], ['丈夫', 5], ['妻子', 5],
    ['老公', 5], ['老婆', 5], ['亲戚', 4], ['婚姻', 4], ['家里', 4],
  ],
  study: [
    ['学习', 5], ['学业', 5], ['考试', 5], ['成绩', 5], ['学校', 4],
    ['大学', 4], ['老师', 4], ['作业', 4], ['论文', 5], ['考研', 5],
    ['留学', 5], ['专业', 3], ['课程', 4], ['复习', 5], ['毕业', 4],
  ],
  health: [
    ['健康', 5], ['身体', 5], ['生病', 5], ['医院', 5], ['医生', 5],
    ['睡眠', 5], ['失眠', 5], ['焦虑', 4], ['压力', 3], ['疲惫', 4],
    ['疼', 4], ['痛', 3], ['减肥', 4], ['运动', 3], ['情绪', 2],
  ],
  friendship: [
    ['朋友', 5], ['友情', 5], ['闺蜜', 5], ['兄弟', 4], ['社交', 4],
    ['友谊', 5], ['绝交', 5], ['朋友圈', 3], ['室友', 4],
  ],
  decision: [
    ['选择', 3], ['决定', 3], ['要不要', 2], ['该不该', 2], ['是否', 1],
    ['应该', 1], ['还是', 2], ['哪一个', 2], ['怎么办', 1], ['可以吗', 1],
  ],
  luck: [
    ['运气', 5], ['好运', 5], ['幸运', 5], ['中奖', 5], ['抽奖', 5],
    ['机会', 2], ['贵人', 4], ['愿望', 3], ['惊喜', 3],
  ],
};

const INTENT_RULES = [
  {
    question: ['说', '聊', '谈', '联系', '沟通', '道歉', '解释', '表白'],
    answer: ['说', '聊', '谈', '沟通', '联系', '开口', '表达', '道歉', '坦诚', '真心'],
  },
  {
    question: ['换工作', '跳槽', '辞职', '换公司', '找工作'],
    answer: ['换团队', '投递', '联系', '机会', '争取', '窗口期', '轨道'],
  },
  {
    question: ['投资', '理财', '股票', '基金', '买房', '花钱'],
    answer: ['投资', '预算', '成本', '谨慎', '观察', '金额', '现金流'],
  },
  {
    question: ['考试', '成绩', '通过', '考研', '复习'],
    answer: ['考试', '成绩', '准备', '复习', '进步', '表现', '稳'],
  },
  {
    question: ['现在', '今天', '马上', '立刻', '尽快', '什么时候'],
    answer: ['现在', '今天', '先', '开始', '行动', '推进', '早'],
  },
  {
    question: ['等', '再等等', '着急', '太快', '时机'],
    answer: ['等', '慢', '别急', '耐心', '观察', '暂时', '时机'],
  },
  {
    question: ['风险', '安全', '稳妥', '担心', '害怕', '失败'],
    answer: ['稳', '谨慎', '后路', '风险', '别怕', '准备', '克制'],
  },
  {
    question: ['选', '选择', '决定', '还是', '要不要', '该不该'],
    answer: ['选', '决定', '利弊', '方向', '接受', '拒绝', '答案偏向'],
  },
  {
    question: ['关系', '误会', '吵架', '矛盾', '冷淡', '疏远'],
    answer: ['关系', '误会', '理解', '体谅', '修复', '放下', '空间'],
  },
  {
    question: ['努力', '坚持', '继续', '放弃', '累'],
    answer: ['坚持', '继续', '努力', '休息', '节奏', '完成', '成长'],
  },
  {
    question: ['能不能', '会不会', '有希望', '成功', '结果'],
    answer: ['可以', '会', '希望', '机会', '答案偏向肯定', '结果', '期待'],
  },
];

const normalize = (value) => value.trim().toLowerCase().replace(/\s+/g, '');

const stableHash = (value) => {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = ((hash << 5) - hash + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
};

export function classifyQuestion(question, categories) {
  const normalizedQuestion = normalize(question);
  const scores = categories.map((category, index) => {
    const rules = CATEGORY_RULES[category.key] || [];
    const score = rules.reduce(
      (total, [keyword, weight]) => total + (normalizedQuestion.includes(keyword) ? weight : 0),
      0
    );
    return { category, score, index };
  });

  scores.sort((a, b) => b.score - a.score || a.index - b.index);
  if (scores[0]?.score > 0) return scores[0].category;

  const decisionCategory = categories.find((category) => category.key === 'decision');
  if (/[?？]|吗$|么$|要不要|该不该|是否|怎么办/.test(normalizedQuestion)) {
    return decisionCategory || categories[0];
  }

  return categories.find((category) => category.key === 'life') || categories[0];
}

export function chooseAnswer(question, category) {
  const normalizedQuestion = normalize(question);
  const answers = category?.answers || [];
  if (!answers.length) return '';

  const ranked = answers.map((answer, index) => {
    let score = 0;

    INTENT_RULES.forEach((rule) => {
      if (rule.question.some((keyword) => normalizedQuestion.includes(keyword))) {
        score += rule.answer.reduce(
          (total, keyword) => total + (answer.includes(keyword) ? 3 : 0),
          0
        );
      }
    });

    return {
      answer,
      index,
      score,
      tieBreaker: stableHash(`${normalizedQuestion}:${answer}`),
    };
  });

  ranked.sort(
    (a, b) => b.score - a.score || a.tieBreaker - b.tieBreaker || a.index - b.index
  );

  return ranked[0].answer;
}
