import { useEffect, useState } from "react";

function Expenses({ groupId, groups, onGroupChange, onNext, onBack }) {
  const [members, setMembers] = useState([]);

  const [expenses, setExpenses] = useState([]);

  const [description, setDescription] = useState("");

  const [amount, setAmount] = useState("");

  const [paidById, setPaidById] = useState("");

  const [participantIds, setParticipantIds] = useState([]);

  const [loading, setLoading] = useState(true);

  const [deletingId, setDeletingId] = useState(null);

  const [editingExpenseId, setEditingExpenseId] = useState(null);

  /* =================================================

       LOAD MEMBERS + EXPENSES

       ================================================= */

  const loadData = async () => {
    try {
      setLoading(true);

      const membersResponse = await fetch(
        `http://localhost:8080/api/members/group/${groupId}`,
      );

      const expensesResponse = await fetch(
        `http://localhost:8080/api/expenses/group/${groupId}`,
      );

      if (!membersResponse.ok || !expensesResponse.ok) {
        throw new Error("Failed to load group data");
      }

      const membersData = await membersResponse.json();

      const expensesData = await expensesResponse.json();

      setMembers(membersData);

      setExpenses(expensesData);
    } catch (error) {
      console.error("Error loading expense data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (groupId) {
      setParticipantIds([]);
      setPaidById("");
      loadData();
    }
  }, [groupId]);
  /* =================================================

       PARTICIPANT SELECTION

       ================================================= */
  const toggleParticipant = (memberId) => {
    setParticipantIds((current) => {
      if (current.includes(memberId)) {
        return current.filter((id) => id !== memberId);
      }
      return [...current, memberId];
    });
  };
  /* =================================================

       ADD EXPENSE

       ================================================= */
  const handleAddExpense = async (event) => {
    event.preventDefault();

    if (!description.trim()) {
      alert("Please enter an expense description.");
      return;
    }

    if (!amount || Number(amount) <= 0) {
      alert("Please enter a valid amount.");
      return;
    }

    if (!paidById) {
      alert("Please select who paid.");
      return;
    }

    if (participantIds.length === 0) {
      alert("Please select at least one participant.");
      return;
    }

    try {
      const isEditing = editingExpenseId !== null;

      const url = isEditing
        ? `http://localhost:8080/api/expenses/${editingExpenseId}`
        : `http://localhost:8080/api/expenses/group/${groupId}`;

      const response = await fetch(url, {
        method: isEditing ? "PUT" : "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          title: description.trim(),

          amount: Number(amount),

          category: "General",

          date: isEditing
            ? expenses.find((expense) => expense.id === editingExpenseId)
                ?.date || new Date().toISOString().split("T")[0]
            : new Date().toISOString().split("T")[0],

          description: description.trim(),

          paidById: Number(paidById),

          participantIds: participantIds,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();

        throw new Error(
          errorText ||
            (isEditing ? "Unable to update expense" : "Unable to add expense"),
        );
      }

      /*
       * Reload from MySQL.
       * This makes sure the UI displays
       * the actual saved database records.
       */

      await loadData();

      /* Clear form */

      setDescription("");
      setAmount("");
      setPaidById("");
      setParticipantIds([]);
      setEditingExpenseId(null);
    } catch (error) {
      console.error(
        isEditing ? "Error updating expense:" : "Error adding expense:",
        error,
      );

      alert(error.message);
    }
  };

  const handleDeleteExpense = async (expenseId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this expense?",
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(expenseId);
      const response = await fetch(
        `http://localhost:8080/api/expenses/${expenseId}`,
        {
          method: "DELETE",
        },
      );

      if (!response.ok) {
        throw new Error("Unable to delete expense");
      }

      await loadData();
    } catch (error) {
      console.error("Error deleting expense:", error);

      alert(error.message);
    } finally {
      setDeletingId(null);
    }
  };

  /* =================================================

       EDIT EXPENSE

       ================================================= */

  const handleEditExpense = (expense) => {
    setEditingExpenseId(expense.id);

    setDescription(expense.description || expense.title || "");

    setAmount(expense.amount ?? "");

    setPaidById(expense.paidBy?.id ? String(expense.paidBy.id) : "");

    setParticipantIds(
      expense.participants
        ?.map((participant) => participant.member?.id)
        .filter(Boolean) || [],
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleCancelEdit = () => {
    setEditingExpenseId(null);
    setDescription("");
    setAmount("");
    setPaidById("");
    setParticipantIds([]);
  };

  /* =================================================

       LOADING

       ================================================= */

  if (loading) {
    return (
      <div className="expenses-page">
        <div className="expense-loading">Loading expenses...</div>
      </div>
    );
  }

  return (
    <div className="expenses-page">
      {/* =================================================

                PAGE HEADER

                ================================================= */}

      <div className="expenses-header">
        <h1>Manage Expenses</h1>

        <p>Add and manage shared expenses for your group.</p>
      </div>

      {/* =================================================

                GROUP SELECTOR

                ================================================= */}

      <div className="group-selector-card">
        <label>Select Group</label>

        <select
          value={groupId}
          onChange={(e) => {
            const selected = groups.find(
              (group) => group.id === Number(e.target.value),
            );

            if (selected) {
              onGroupChange(selected);
            }
          }}
        >
          {groups.map((group) => (
            <option key={group.id} value={group.id}>
              {group.name}
            </option>
          ))}
        </select>
      </div>

      {/* =================================================

                ADD EXPENSE CARD

                ================================================= */}
      <div className="add-expense-card">
        <div className="expense-card-heading">
          <div>
            <span className="section-label">
              {editingExpenseId ? "EDIT EXPENSE" : "NEW EXPENSE"}
            </span>

            <h2>{editingExpenseId ? "Edit Expense" : "Add Expense"}</h2>
          </div>

          <div className="rupee-icon">₹</div>
        </div>

        <form onSubmit={handleAddExpense}>
          {/* DESCRIPTION + AMOUNT + PAID BY */}

          <div className="expense-form-grid">
            {/* DESCRIPTION */}

            <div className="input-group">
              <label>Description</label>

              <input
                type="text"
                placeholder="Dinner, groceries..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {/* AMOUNT */}

            <div className="input-group">
              <label>Total Amount</label>

              <div className="amount-input">
                <span>₹</span>

                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
            </div>

            {/* PAID BY */}

            <div className="input-group">
              <label>Paid By</label>

              <select
                value={paidById}
                onChange={(e) => setPaidById(e.target.value)}
              >
                <option value="">Select member</option>

                {members.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* =================================================

                        PARTICIPANTS

                        ================================================= */}

          <div className="participants-section">
            <div className="participants-header">
              <div>
                <h3>Participants</h3>

                <p>Select everyone who shares this expense.</p>
              </div>

              <span className="selected-count">
                {participantIds.length} selected
              </span>
            </div>

            <div className="participants-grid">
              {members.map((member) => {
                const selected = participantIds.includes(member.id);

                return (
                  <button
                    type="button"
                    key={member.id}
                    className={`participant-card ${selected ? "selected" : ""}`}
                    onClick={() => toggleParticipant(member.id)}
                  >
                    <span className="member-avatar">
                      {member.name

                        .charAt(0)

                        .toUpperCase()}
                    </span>

                    <span className="member-name">{member.name}</span>

                    <span className="participant-check">
                      {selected ? "✓" : ""}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ADD BUTTON */}

          <button type="submit" className="add-expense-button">
            {editingExpenseId ? "Update Expense" : "Add Expense"}

            <span>→</span>
          </button>

          {editingExpenseId && (
            <button
              type="button"
              className="back-home-button"
              onClick={handleCancelEdit}
            >
              Cancel Edit
            </button>
          )}
        </form>
      </div>

      {/* =================================================

                EXISTING EXPENSES

                ================================================= */}

      <div className="records-section">
        <div className="records-heading">
          <div>
            <span className="section-label">RECORDS</span>

            <h2>Expenses</h2>
          </div>

          <span className="record-count">{expenses.length}</span>
        </div>

        {expenses.length === 0 ? (
          <div className="empty-expenses">
            <div className="empty-icon">₹</div>

            <h3>No expenses yet</h3>

            <p>Add your first shared expense above.</p>
          </div>
        ) : (
          <div className="expense-record-grid">
            {expenses.map((expense) => {
              const payer = expense.paidBy?.name || "Unknown";

              return (
                <div className="expense-record" key={expense.id}>
                  <div className="record-top">
                    <div className="record-icon">₹</div>

                    <div>
                      <h3>{expense.title}</h3>

                      <p>Paid by {payer}</p>
                    </div>
                  </div>

                  <div className="record-amount">
                    ₹{Number(expense.amount).toFixed(2)}
                  </div>

                  <div className="record-divider" />

                  <span className="participants-title">PARTICIPANTS</span>

                  <div className="record-participants">
                    {expense.participants?.map((participant) => (
                      <span key={participant.id}>
                        {participant.member?.name}
                      </span>
                    ))}
                  </div>

                  {/* RECORD ACTIONS */}

                  <div className="record-actions">
                    <button
                      type="button"
                      className="edit-button"
                      onClick={() => handleEditExpense(expense)}
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      className="delete-button"
                      disabled={deletingId === expense.id}
                      onClick={() => handleDeleteExpense(expense.id)}
                    >
                      {deletingId === expense.id ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* =================================================

                CALCULATION

                ================================================= */}

      <button className="calculation-button" onClick={onNext}>
        Expense Calculation
        <span>→</span>
      </button>

      {/* =================================================

                BACK

                ================================================= */}

      <button className="back-home-button" onClick={onBack}>
        ← Back to Home
      </button>
    </div>
  );
}

export default Expenses;
