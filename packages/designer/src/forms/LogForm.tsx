import { useForm } from 'react-hook-form';
import { FlowNode } from '@flowcamel/core';

interface Props { node: FlowNode; onSave: (props: FlowNode['props']) => void; }

export function LogForm({ node, onSave }: Props) {
  const { register, handleSubmit } = useForm({ defaultValues: node.props });
  return (
    <form onSubmit={handleSubmit(onSave)}>
      <div className="fc-field">
        <label>Log message</label>
        <input {...register('message', { required: 'Required' })} placeholder="Received: ${body}" />
      </div>
      <div className="fc-field">
        <label>Log level</label>
        <select {...register('level')}>
          <option value="INFO">INFO</option>
          <option value="DEBUG">DEBUG</option>
          <option value="WARN">WARN</option>
          <option value="ERROR">ERROR</option>
        </select>
      </div>
      <button type="submit" className="fc-form-save">Save</button>
    </form>
  );
}
