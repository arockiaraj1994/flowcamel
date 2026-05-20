import { useForm } from 'react-hook-form';
import { FlowNode } from '@flowcamel/core';

interface Props { node: FlowNode; onSave: (props: FlowNode['props']) => void; }

export function SplitForm({ node, onSave }: Props) {
  const { register, handleSubmit } = useForm({ defaultValues: node.props });
  return (
    <form onSubmit={handleSubmit(onSave)}>
      <div className="fc-field">
        <label>Split by</label>
        <select {...register('delimiter')}>
          <option value="newline">New line</option>
          <option value="comma">Comma</option>
          <option value="json-array">JSON array items</option>
        </select>
      </div>
      <button type="submit" className="fc-form-save">Save</button>
    </form>
  );
}
