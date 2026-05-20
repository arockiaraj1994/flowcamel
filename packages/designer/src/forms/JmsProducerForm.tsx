import { useForm } from 'react-hook-form';
import { FlowNode } from '@flowcamel/core';

interface Props { node: FlowNode; onSave: (props: FlowNode['props']) => void; }

export function JmsProducerForm({ node, onSave }: Props) {
  const { register, handleSubmit } = useForm({ defaultValues: node.props });
  return (
    <form onSubmit={handleSubmit(onSave)}>
      <div className="fc-field">
        <label>Broker URL</label>
        <input {...register('brokerUrl', { required: 'Required' })} placeholder="tcp://localhost:61616" />
      </div>
      <div className="fc-field">
        <label>Destination type</label>
        <select {...register('destinationType')}>
          <option value="queue">Queue</option>
          <option value="topic">Topic</option>
        </select>
      </div>
      <div className="fc-field">
        <label>Queue / Topic name</label>
        <input {...register('destination', { required: 'Required' })} placeholder="orders.processed" />
      </div>
      <button type="submit" className="fc-form-save">Save</button>
    </form>
  );
}
