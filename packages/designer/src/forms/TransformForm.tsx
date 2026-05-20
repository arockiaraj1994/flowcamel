import { useForm } from 'react-hook-form';
import { FlowNode } from '@flowcamel/core';

interface Props { node: FlowNode; onSave: (props: FlowNode['props']) => void; }

export function TransformForm({ node, onSave }: Props) {
  const { register, handleSubmit } = useForm({ defaultValues: node.props });
  return (
    <form onSubmit={handleSubmit(onSave)}>
      <div className="fc-field">
        <label>Expression</label>
        <input {...register('expression', { required: 'Required' })} placeholder="${body.toUpperCase()}" />
      </div>
      <div className="fc-field">
        <label>Language</label>
        <select {...register('language')}>
          <option value="simple">Simple</option>
          <option value="groovy">Groovy</option>
          <option value="jsonpath">JSONPath</option>
        </select>
      </div>
      <button type="submit" className="fc-form-save">Save</button>
    </form>
  );
}
