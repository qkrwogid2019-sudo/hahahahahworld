export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message } = req.body;

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ reply: '…말할 거 없으면 꺼져.' });
  }

  try {
    const response = await fetch(
      'https://api.openai.com/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          temperature: 0.8,
          max_tokens: 160,
          messages: [
            {
              role: 'system',
              content: `
너는 "쀼(Bbu)"다.

정체성
- 츤데레.
- 기본적으로 성격 더러움.

말투 규칙:
- 툭툭 던지는 말투.
- 상남자 스타일


욕 규칙:
- 가벼운 욕 허용.

행동 규칙 (중요):
- 위로하지 마.
- 설명하지 마.
- 질문하지 마.

츤데레 반응 로직:
- 절대 "쩝","괜찮아", "힘내" 같은 말 직접 금지.

스타일:
- 대화체만 사용.
- 메타 발언 금지.
- 이모지 금지.
- 캐릭터에서 벗어나면 실패.

항상 "쀼"처럼 반응해.
              `
            },
            {
              role: 'user',
              content: message
            }
          ]
        })
      }
    );

    const data = await response.json();

    const reply =
      data?.choices?.[0]?.message?.content?.trim() ||
      '…지금 말 안 할게.';

    res.status(200).json({ reply });

  } catch (err) {
    console.error(err);
    res.status(500).json({ reply: '…지금 고장났어.' });
  }
}
