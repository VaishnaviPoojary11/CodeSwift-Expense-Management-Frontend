import { useEffect, useState } from "react";

function Settlement({
  groupId,
  groups,
  onBack,
  onHome,
  onOverview,
}) {
  const [members, setMembers] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  /* =================================================
       LOAD MEMBERS + EXPENSES
       ================================================= */

  useEffect(() => {
    if (groupId) {
      loadSettlementData();
    }
  }, [groupId]);

  const loadSettlementData = async () => {
    try {
      setLoading(true);

      const membersResponse = await fetch(
        `http://localhost:8080/api/members/group/${groupId}`,
      );

      const expensesResponse = await fetch(
        `http://localhost:8080/api/expenses/group/${groupId}`,
      );

      if (!membersResponse.ok || !expensesResponse.ok) {
        throw new Error("Failed to load settlement data");
      }

      const membersData = await membersResponse.json();
      const expensesData = await expensesResponse.json();

      setMembers(membersData);
      setExpenses(expensesData);
    } catch (error) {
      console.error("Error loading settlement data:", error);
    } finally {
      setLoading(false);
    }
  };

  /* =================================================
       GROUP DETAILS
       ================================================= */

  const selectedGroup = groups.find(
    (group) => group.id === Number(groupId),
  );

  const groupName = selectedGroup?.name || "Group";

  /* =================================================
       CALCULATE BALANCES
       ================================================= */

  const balances = members.map((member) => {
    let totalPaid = 0;
    let actualShare = 0;

    expenses.forEach((expense) => {
      /* TOTAL PAID */

      if (expense.paidBy?.id === member.id) {
        totalPaid += Number(expense.amount || 0);
      }

      /* ACTUAL SHARE */

      expense.participants?.forEach((participant) => {
        if (participant.member?.id === member.id) {
          actualShare += Number(
            participant.shareAmount || 0,
          );
        }
      });
    });

    return {
      id: member.id,
      name: member.name,
      balance: Number(
        (totalPaid - actualShare).toFixed(2),
      ),
    };
  });

  /* =================================================
       SETTLEMENT CALCULATION
       ================================================= */

  const calculateSettlements = () => {
    const creditors = balances
      .filter((member) => member.balance > 0.009)
      .map((member) => ({
        ...member,
        amount: member.balance,
      }));

    const debtors = balances
      .filter((member) => member.balance < -0.009)
      .map((member) => ({
        ...member,
        amount: Math.abs(member.balance),
      }));

    const settlements = [];

    let creditorIndex = 0;
    let debtorIndex = 0;

    while (
      creditorIndex < creditors.length &&
      debtorIndex < debtors.length
    ) {
      const creditor = creditors[creditorIndex];
      const debtor = debtors[debtorIndex];

      const payment = Math.min(
        creditor.amount,
        debtor.amount,
      );

      settlements.push({
        from: debtor.name,
        to: creditor.name,
        amount: Number(payment.toFixed(2)),
      });

      creditor.amount = Number(
        (creditor.amount - payment).toFixed(2),
      );

      debtor.amount = Number(
        (debtor.amount - payment).toFixed(2),
      );

      if (creditor.amount < 0.01) {
        creditorIndex++;
      }

      if (debtor.amount < 0.01) {
        debtorIndex++;
      }
    }

    return settlements;
  };

  const settlements = calculateSettlements();

  /* =================================================
       FORMAT MONEY
       ================================================= */

  const formatAmount = (amount) => {
    return Number(amount).toFixed(2);
  };

  /* =================================================
       LOADING
       ================================================= */

  if (loading) {
    return (
      <div className="settlement-page">
        <div className="settlement-loading">
          Loading settlement logic...
        </div>
      </div>
    );
  }

  /* =================================================
       PAGE
       ================================================= */

  return (
    <div className="settlement-page">

      {/* =================================================
           PAGE HEADER
           ================================================= */}

      <div className="settlement-header">

        <span className="settlement-label">
          SETTLEMENT BREAKDOWN
        </span>

        <h1>
          Settlement Logic
        </h1>

        <p>
          See who needs to pay whom and how much.
        </p>

      </div>


      {/* =================================================
           GROUP SUMMARY
           ================================================= */}

      <div className="settlement-group-card">

        <span className="settlement-group-label">
          GROUP
        </span>

        <h2>
          {groupName}
        </h2>

        <p>
          {members.length} members
          {" · "}
          {settlements.length} settlements
        </p>

      </div>


      {/* =================================================
           SETTLEMENTS
           ================================================= */}

      <div className="settlements-section">

        <span className="settlements-label">
          PAYMENTS
        </span>

        <h2>
          Who Pays Whom
        </h2>


        {settlements.length > 0 ? (

          <div className="settlement-list">

            {settlements.map(
              (settlement, index) => (

                <div
                  className="settlement-card"
                  key={index}
                >

                  <div className="settlement-person">

                    <div className="settlement-number">
                      {index + 1}
                    </div>

                    <div>
                      <span className="settlement-small-label">
                        PAYS
                      </span>

                      <strong>
                        {settlement.from}
                      </strong>
                    </div>

                  </div>


                  <div className="settlement-arrow">
                    →
                  </div>


                  <div className="settlement-person">

                    <div>
                      <span className="settlement-small-label">
                        RECEIVES
                      </span>

                      <strong>
                        {settlement.to}
                      </strong>
                    </div>

                  </div>


                  <div className="settlement-amount">
                    ₹{formatAmount(settlement.amount)}
                  </div>

                </div>
              ),
            )}

          </div>

        ) : (

          <div className="no-settlements">
            All expenses are already balanced.
          </div>

        )}

      </div>


      {/* =================================================
           NAVIGATION
           ================================================= */}

      <div className="settlement-navigation">

        <button
          className="settlement-nav-button"
          onClick={onBack}
        >
          ← Calculation
        </button>

        <button
          className="settlement-nav-button"
          onClick={onHome}
        >
          ← Back to Home
        </button>

      </div>


      {/* =================================================
           OVERVIEW
           ================================================= */}

      <button
        className="overview-button"
        onClick={onOverview}
      >
        Continue to Overview
        <span>→</span>
      </button>

    </div>
  );
}

export default Settlement;