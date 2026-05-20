import { useForm } from 'react-hook-form';
import { FlowNode } from '@flowcamel/core';

interface Props { node: FlowNode; onSave: (props: FlowNode['props']) => void; }

export function TimerForm({ node, onSave }: Props) {
  const { register, handleSubmit } = useForm({ defaultValues: node.props });
  return (
    <form onSubmit={handleSubmit(onSave)}>
      <div className="fc-field">
        <label>Interval (ms)</label>
        <input type="number" {...register('period', { required: 'Required' })} placeholder="1000" />
      </div>
      <button type="submit" className="fc-form-save">Save</button>
    </form>
  );
}
