import { useState, useEffect, useMemo } from 'react';
import type { BlockDefinition } from '@flowcamel/core';
import type { FlowNode } from '@flowcamel/core';
import { EipGlyph } from './EipGlyph.js';
import { CatalogPropertyField } from './CatalogPropertyField.js';
import { getDefaultPropsForBlock, getWizardSteps } from '@flowcamel/core';

interface Props {
  block: BlockDefinition;
  node: FlowNode;
  onNodeUpdate: (nodeId: string, props: Record<string, string>) => void;
  onOpenConfig: () => void;
}

interface PanelHeaderProps {
  block: BlockDefinition;
  node: FlowNode;
}

function PanelHeader({ block, node }: PanelHeaderProps) {
  const cat = block.category.toLowerCase();
  return (
    <div className="rpanel-head">
      <div
        className="node-icon"
        style={{
          background: `var(--${cat === 'source' ? 'teal' : cat === 'action' ? 'purple' : 'amber'}-bg)`,
          color: `var(--${cat === 'source' ? 'teal' : cat === 'action' ? 'purple' : 'amber'}-fg)`,
        }}
      >
        <i className={`ti ${block.icon}`} />
      </div>
      <div className="rpanel-titles">
        <div className="rpanel-title">{node.label || block.label}</div>
        <div className="rpanel-sub">
          {block.scheme ? `${block.scheme} · ` : ''}
          {block.type}
        </div>
      </div>
    </div>
  );
}

function AIHintFoot({ block }: { block: BlockDefinition }) {
  const hint = aiHintFor(block);
  return (
    <div className="rpanel-foot">
      <div className="ai-tag"><span className="spark">✦</span> AI suggest</div>
      <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>{hint}</div>
    </div>
  );
}

function aiHintFor(block: BlockDefinition): string {
  switch (block.type) {
    case 'sftp-source': return 'Try "poll every 5 minutes and only pick .xml files"';
    case 'filter-action': return 'Try "amount bigger than 1000" — I can translate plain English into a rule.';
    case 'log-action': return 'Tip: ${body} drops in the message contents; ${header.foo} drops in a header.';
    case 'log-dest': return 'Tip: The full message body is written to the log — check your console or log file.';
    case 'transform-action': return 'Most APIs prefer JSON. If you don\'t know, JSON is a safe default.';
    case 'set-body-action': return 'After a Timer, try constant text like "tick" or simple "${body}" to pass data through.';
    case 'timer-source': return '5m is a good starting point — easy to test, gentle on systems.';
    default: return 'Press Tab to jump fields, or describe what you want and I\'ll fill it in.';
  }
}

export function WizardPanel({ block, node, onNodeUpdate, onOpenConfig }: Props) {
  const steps = getWizardSteps(block.type);
  const stepsTotal = steps.length;

  const initialStep = useMemo(() => {
    const firstEmpty = steps.findIndex((s) => !node.props[s.key] || node.props[s.key] === '');
    return firstEmpty === -1 ? stepsTotal : firstEmpty;
  }, [node.id]);

  const [stepIdx, setStepIdx] = useState(initialStep);
  const [scratch, setScratch] = useState<Record<string, string>>({});

  useEffect(() => {
    setStepIdx(initialStep);
    setScratch({});
    const defaults = getDefaultPropsForBlock(block.type);
    const patch: Record<string, string> = {};
    for (const [k, v] of Object.entries(defaults)) {
      if (!node.props[k]) patch[k] = v;
    }
    if (Object.keys(patch).length > 0) {
      onNodeUpdate(node.id, { ...defaults, ...node.props });
    }
  }, [node.id, block.type]);

  if (stepIdx >= stepsTotal) {
    return (
      <div className="rpanel">
        <PanelHeader block={block} node={node} />
        <div className="rpanel-body">
          <div className="wiz-done">
            <div className="check"><i className="ti ti-check" /></div>
            <div className="wiz-done-title">Looking good!</div>
            <div className="wiz-done-sub">You've answered everything we need. Here's a quick recap:</div>
            <div className="wiz-review">
              {steps.map((s) => (
                <div className="wiz-review-row" key={s.key}>
                  <span className="wiz-review-key">{s.label}</span>
                  <span className="wiz-review-val">{node.props[s.key] || '—'}</span>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-sm" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setStepIdx(0)}>
                <i className="ti ti-arrow-back-up" /> Walk through again
              </button>
              <button className="btn btn-sm" style={{ flex: 1, justifyContent: 'center' }} onClick={onOpenConfig}>
                <i className="ti ti-adjustments" /> All properties
              </button>
            </div>
          </div>
        </div>
        <AIHintFoot block={block} />
      </div>
    );
  }

  const step = steps[stepIdx];
  if (!step) return null;

  const scratchVal = scratch[step.key];
  const defaultStr =
    step.defaultValue !== undefined && step.defaultValue !== '' ? String(step.defaultValue) : '';
  const val = scratchVal !== undefined ? scratchVal : (node.props[step.key] ?? defaultStr);
  const setVal = (v: string) => setScratch({ ...scratch, [step.key]: v });
  const filled = val !== '' && val !== undefined && val !== null;
  const canAdvance = filled || step.type === 'number';

  const commit = () => {
    const sv = scratch[step.key];
    if (sv !== undefined) {
      onNodeUpdate(node.id, { ...node.props, [step.key]: sv });
    }
  };
  const next = () => { commit(); setStepIdx(stepIdx + 1); setScratch({}); };
  const prev = () => { commit(); setStepIdx(Math.max(0, stepIdx - 1)); setScratch({}); };
  const skip = () => { setStepIdx(stepIdx + 1); setScratch({}); };

  return (
    <div className="rpanel">
      <PanelHeader block={block} node={node} />
      <div className="rpanel-body">
        <div className="wiz-stepnum">
          <span>Step {stepIdx + 1} of {stepsTotal}</span>
          <span>{block.label}</span>
        </div>
        <div className="wiz-progress">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`wiz-progress-step${i < stepIdx ? ' done' : i === stepIdx ? ' current' : ''}`}
            />
          ))}
        </div>

        <div className="wiz-glyph">
          <EipGlyph kind={block.glyph} />
        </div>

        <div className="wiz-question">{step.q || step.label}</div>
        {step.help && <div className="wiz-help">{step.help}</div>}

        <div className="field-label">{step.label}</div>
        <CatalogPropertyField step={step} value={val} onChange={setVal} onEnter={next} />

        {stepIdx === 0 && (
          <div className="wiz-tip">
            <i className="ti ti-bulb" />
            <div>
              <div style={{ fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: 2 }}>
                What is {block.label}?
              </div>
              {block.explain}
            </div>
          </div>
        )}

        <div className="wiz-nav">
          <button className="btn btn-sm" disabled={stepIdx === 0} onClick={prev} style={{ opacity: stepIdx === 0 ? 0.4 : 1 }}>
            <i className="ti ti-arrow-left" /> Back
          </button>
          <button className="btn btn-primary btn-sm" onClick={next} disabled={!canAdvance}>
            {stepIdx === stepsTotal - 1 ? 'Finish' : 'Next'} <i className="ti ti-arrow-right" />
          </button>
        </div>
        <div className="wiz-skip" onClick={skip}>Skip this for now</div>
      </div>
      <AIHintFoot block={block} />
    </div>
  );
}
