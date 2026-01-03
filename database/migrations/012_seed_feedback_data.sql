-- Seed data for SER222 Grading Comments
-- Insert sample modules and feedback elements based on the provided comments

-- Insert modules
INSERT INTO feedback_modules (title, description, position) VALUES
  ('Prerequisites Module', 'Common feedback for prerequisite concepts', 1),
  ('Data Structure Feedback', 'Comments on data structure implementation', 2),
  ('Interface Implementation', 'Feedback on implementing interfaces', 3),
  ('Algorithm Analysis', 'Comments on algorithm selection and analysis', 4),
  ('Mathematical Proofs', 'Feedback on proof techniques and base cases', 5),
  ('Logic and Reasoning', 'General logic and problem-solving feedback', 6);

-- Insert feedback elements for Prerequisites Module
INSERT INTO feedback_elements (module_id, content, position) 
VALUES 
  ((SELECT id FROM feedback_modules WHERE title = 'Prerequisites Module'), 
   'I encourage you to review the trace of stack operations.', 1),
  ((SELECT id FROM feedback_modules WHERE title = 'Prerequisites Module'), 
   'You need to declare one variable to store the int 
And the other to node of LinearIntNode type to store the next node.

For instance:
private int value;
private LinearIntNode next;', 2);

-- Insert feedback elements for Interface Implementation
INSERT INTO feedback_elements (module_id, content, position) 
VALUES 
  ((SELECT id FROM feedback_modules WHERE title = 'Interface Implementation'), 
   'The Adder class needs to implement the simpleAdder Interface. I would encourage to review the syntax on how a class needs to implement the interface.', 1);

-- Insert feedback elements for Algorithm Analysis
INSERT INTO feedback_elements (module_id, content, position) 
VALUES 
  ((SELECT id FROM feedback_modules WHERE title = 'Algorithm Analysis'), 
   'Insertion sort, because it performs very well on nearly sorted arrays, almost linear time in the best case.
Selection sort always does the same number of comparisons regardless of order, so it''s slower for this case.', 1);

-- Insert feedback elements for Mathematical Proofs
INSERT INTO feedback_elements (module_id, content, position) 
VALUES 
  ((SELECT id FROM feedback_modules WHERE title = 'Mathematical Proofs'), 
   'O(n^2)
Big-oh is the term with highest complexity among the other terms with coefficient dropped.', 1),
  ((SELECT id FROM feedback_modules WHERE title = 'Mathematical Proofs'), 
   'The base case shows the statement works for the starting value (like n = 1). And the inductive step proves that if it works for one value, it also works for the next.', 2);

-- Insert feedback elements for Logic and Reasoning
INSERT INTO feedback_elements (module_id, content, position) 
VALUES 
  ((SELECT id FROM feedback_modules WHERE title = 'Logic and Reasoning'), 
   'In mathematics, the pigeonhole principle states that if n items are put into m containers, with n > m, then at least one container must contain more than one item [Wiki]', 1);
