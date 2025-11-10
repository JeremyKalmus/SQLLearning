import { FileText } from 'lucide-react';
import PropTypes from 'prop-types';

export default function Notepad({ notes, setNotes }) {
  return (
    <div className="notepad">
      <h4>
        <FileText size={16} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '8px' }} />
        Notes
      </h4>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Take notes here...&#10;&#10;• Plan your query&#10;• Write down key insights&#10;• Track your progress"
        className="notepad-textarea"
      />
    </div>
  );
}

Notepad.propTypes = {
  notes: PropTypes.string.isRequired,
  setNotes: PropTypes.func.isRequired
};
