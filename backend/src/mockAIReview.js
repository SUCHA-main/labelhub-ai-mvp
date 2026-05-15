export function mockAIReview(annotation) {
  const values = Object.values(annotation || {}).join(' ').toLowerCase();
  const hasShortAnswer = Object.values(annotation || {}).some(
    (value) => String(value || '').trim().length < 2
  );
  const riskKeywords = ['不确定', '不知道', '随便', '未知'];
  const hasRiskKeyword = riskKeywords.some((keyword) => values.includes(keyword));
  const riskLevel = hasShortAnswer || hasRiskKeyword ? '中' : '低';

  return {
    confidence: riskLevel === '低' ? 0.86 : 0.62,
    risks:
      riskLevel === '低'
        ? ['未发现明显一致性风险']
        : ['标注内容可能不够充分或包含不确定表达'],
    suggestions:
      riskLevel === '低'
        ? ['可进入人工审核']
        : ['建议补充判断依据，并检查标签是否符合文本语义']
  };
}
