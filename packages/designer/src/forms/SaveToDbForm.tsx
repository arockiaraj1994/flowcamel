import { useForm } from 'react-hook-form';
import { FlowNode } from '@flowcamel/core';

interface Props { node: FlowNode; onSave: (props: FlowNode['props']) => void; }

export function SaveToDbForm({ node, onSave }: Props) {
  const { register, handleSubmit } = useForm({ defaultValues: node.props });
  return (
    <form onSubmit={handleSubmit(onSave)}>
      <div className="fc-field">
        <label>JDBC URL</label>
        <input {...register('jdbcUrl', { required: 'Required' })} placeholder="jdbc:postgresql://localhost:5432/mydb" />
      </div>
      <div className="fc-field">
        <label>SQL query</label>
        <input {...register('query', { required: 'Required' })} placeholder="INSERT INTO events(data) VALUES(:?body)" />
      </div>
      <button type="submit" className="fc-form-save">Save</button>
    </form>
  );
}
