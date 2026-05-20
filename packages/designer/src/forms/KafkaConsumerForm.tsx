import { useForm } from 'react-hook-form';
import { FlowNode } from '@flowcamel/core';

interface Props { node: FlowNode; onSave: (props: FlowNode['props']) => void; }

export function KafkaConsumerForm({ node, onSave }: Props) {
  const { register, handleSubmit } = useForm({ defaultValues: node.props });
  return (
    <form onSubmit={handleSubmit(onSave)}>
      <div className="fc-field">
        <label>Brokers</label>
        <input {...register('brokers', { required: 'Required' })} placeholder="localhost:9092" />
      </div>
      <div className="fc-field">
        <label>Topic</label>
        <input {...register('topic', { required: 'Required' })} placeholder="my-topic" />
      </div>
      <div className="fc-field">
        <label>Consumer group</label>
        <input {...register('groupId', { required: 'Required' })} placeholder="my-group" />
      </div>
      <button type="submit" className="fc-form-save">Save</button>
    </form>
  );
}
