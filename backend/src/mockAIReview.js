export function mockAIReview(annotation) {
  const values = Object.values(annotation || {}).join(' ').toLowerCase();
  const hasShortAnswer = Object.values(annotation || {}).some(
    (value) => String(value || '').trim().length < 2
  );
  const riskKeywords = ['不确定', '不知道', '随便', '未知', '违规', '低质', '风险'];
  const hasRiskKeyword = riskKeywords.some((keyword) => values.includes(keyword));
  const riskLevel = hasRiskKeyword ? '高' : hasShortAnswer ? '中' : '低';

  return {
    riskLevel,
    confidence: riskLevel === '低' ? 0.88 : riskLevel === '中' ? 0.69 : 0.53,
    possibleIssue:
      riskLevel === '低'
        ? '标注内容完整，暂未发现明显一致性风险。'
        : riskLevel === '中'
          ? '标注理由可能偏短，审核时需要关注依据是否充分。'
          : '标注中出现风险或不确定表达，需要重点复核。',
    suggestion:
      riskLevel === '低'
        ? '建议进入人工审核确认。'
        : riskLevel === '中'
          ? '建议补充判断依据，并检查标签是否准确匹配文本。'
          : '建议重新核对原文和标签，必要时驳回给标注员修改。'
  };
}
