import { Badge, type StatusKind } from "./Badge";
import styles from "./WireDiagram.module.css";

export type WireItem = {
  /** Display name, title-cased. Never the repo slug. */
  name: string;
  desc?: string;
  integration: StatusKind;
};

export type WireDiagramProps = {
  items: WireItem[];
  /** Label of the vertical spine, e.g. "IDMS". */
  coreLabel: string;
  /** Badge label per status — plain text, so it can be translated. */
  labels?: Partial<Record<StatusKind, string>>;
  /** Caption for each line style in the legend. */
  legendLabels?: Partial<Record<StatusKind, string>>;
  /** Name of the legend list, used as its accessible name. */
  legendTitle?: string;
  /** Name of the branch list, used as its accessible name. */
  itemsTitle?: string;
};

const defaultLabels: Record<StatusKind, string> = {
  core: "Lõi",
  connected: "Đã nối",
  planned: "Dự kiến nối",
  standalone: "Độc lập",
  private: "Repo riêng tư",
};

const defaultLegendLabels: Record<StatusKind, string> = {
  core: "Thuộc lõi IDMS",
  connected: "Đã nối OAuth",
  planned: "Dự kiến nối",
  standalone: "Chạy độc lập",
  private: "Repo riêng tư",
};

/** The four line styles that need explaining; "core" shares its line with "connected". */
const legendOrder: StatusKind[] = ["connected", "planned", "private", "standalone"];

/**
 * Wire diagram: IDMS is the vertical spine, each app is a branch.
 * Line style carries real information (solid = connected, dashed = planned or
 * private repo, no line = standalone), so the diagram **always** has a legend.
 */
export function WireDiagram({
  items,
  coreLabel,
  labels,
  legendLabels,
  legendTitle = "Chú giải",
  itemsTitle = "Ứng dụng trong hệ sinh thái",
}: WireDiagramProps) {
  const badgeText = { ...defaultLabels, ...labels };
  const legendText = { ...defaultLegendLabels, ...legendLabels };

  return (
    <div>
      <div className={styles.wire} data-empty={items.length === 0 ? "true" : undefined}>
        <div className={styles.spine}>
          <span className={styles.core}>{coreLabel}</span>
        </div>

        <ul className={styles.rows} aria-label={itemsTitle}>
          {items.map((item, index) => (
            <li className={styles.row} key={`${item.name}-${index}`}>
              <i className={styles.lead} data-integration={item.integration} aria-hidden="true" />
              <div className={styles.text}>
                <span className={styles.name}>{item.name}</span>
                {item.desc ? <span className={styles.desc}>{item.desc}</span> : null}
              </div>
              <Badge kind={item.integration}>{badgeText[item.integration]}</Badge>
            </li>
          ))}
        </ul>
      </div>

      <ul className={styles.legend} aria-label={legendTitle}>
        {legendOrder.map((kind) => (
          <li className={styles.legendItem} key={kind}>
            <i className={styles.swatch} data-kind={kind} aria-hidden="true" />
            {legendText[kind]}
          </li>
        ))}
      </ul>
    </div>
  );
}
