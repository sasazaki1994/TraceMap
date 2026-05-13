type UsageMeterLiteProps = {
  sourceCount: number;
  claimCount: number;
  answerLength: number;
  reportLength: number;
  provider: string;
  mode: string;
};

function estimatePayloadChars(input: { sourceCount: number; claimCount: number; answerLength: number; reportLength: number }): number {
  return input.answerLength + input.reportLength + input.sourceCount * 120 + input.claimCount * 180;
}

export function UsageMeterLite(props: UsageMeterLiteProps) {
  const items: Array<[string, string | number]> = [
    ["Sources", props.sourceCount],
    ["Claims", props.claimCount],
    ["Answer chars", props.answerLength],
    ["Report chars", props.reportLength],
    ["Provider", props.provider],
    ["Mode", props.mode],
    ["Estimated payload chars", estimatePayloadChars(props)],
  ];

  return (
    <section className="investigation-panel" data-testid="usage-meter-lite" style={{ marginTop: "1.25rem" }}>
      <h3 className="run-question-label">Usage meter lite</h3>
      <ul className="investigation-list">
        {items.map(([label, value]) => (
          <li key={label} className="investigation-list-item" data-testid="usage-meter-item">
            <p className="source-list-item-title">{label}</p>
            <p className="muted">{value}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
