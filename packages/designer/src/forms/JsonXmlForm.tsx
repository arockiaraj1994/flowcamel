import { useForm } from 'react-hook-form';
import { FlowNode } from '@flowcamel/core';

interface Props { node: FlowNode; onSave: (props: FlowNode['props']) => void; }

export function JsonXmlForm({ node, onSave }: Props) {
  const { register, handleSubmit } = useForm({ defaultValues: node.props });
  return (
    <form onSubmit={handleSubmit(onSave)}>
      <div className="fc-field">
        <label>Direction</label>
        <select {...register('direction')}>
          <option value="json-to-xml">JSON → XML</option>
          <option value="xml-to-json">XML → JSON</option>
        </select>
      </div>
      <button type="submit" className="fc-form-save">Save</button>
    </form>
  );
}
