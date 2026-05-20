import { useForm } from 'react-hook-form';
import { FlowNode } from '@flowcamel/core';

interface Props { node: FlowNode; onSave: (props: FlowNode['props']) => void; }

export function HttpCallForm({ node, onSave }: Props) {
  const { register, handleSubmit } = useForm({ defaultValues: node.props });
  return (
    <form onSubmit={handleSubmit(onSave)}>
      <div className="fc-field">
        <label>URL</label>
        <input {...register('url', { required: 'Required' })} placeholder="https://api.example.com/ingest" />
      </div>
      <div className="fc-field">
        <label>HTTP method</label>
        <select {...register('method')}>
          <option value="POST">POST</option>
          <option value="PUT">PUT</option>
          <option value="PATCH">PATCH</option>
        </select>
      </div>
      <button type="submit" className="fc-form-save">Save</button>
    </form>
  );
}
