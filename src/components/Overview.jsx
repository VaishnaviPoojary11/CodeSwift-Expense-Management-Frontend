import { useEffect, useState } from "react";

function Overview({
  groupId,
  groups,
  onBack,
  onHome,
}) {
  const [members, setMembers] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  /* =================================================
       LOAD MEMBERS + EXPENSES
       ================================================= */

  useEffect(() => {
    if (groupId) {
      loadOverviewData();
    }
  }, [groupId]);

  const loadOverviewData = async () => {
    try {
      setLoading(true);

      const membersResponse = await fetch(
        `http://localhost:8080/api/members/group/${groupId}`,
      );

      const expensesResponse = await fetch(
        `http://localhost:8080/api/expenses/group/${groupId}`,
      );

      if (!membersResponse.ok || !expensesResponse.ok) {
        throw new Error("Failed to load overview data");
      }

      const membersData = await membersResponse.json();
      const expensesData = await expensesResponse.json();

      setMembers(membersData);
      setExpenses(expensesData);
    } catch (error) {
      console.error("Error loading overview data:", error);
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
       TOTAL EXPENSE
       ================================================= */

  const totalExpenses = expenses.reduce(
    (total, expense) =>
      total + Number(expense.amount || 0),
    0,
  );

  /* =================================================
       MEMBER BALANCES
       ================================================= */

  const memberBalances = members.map((member) => {
    let totalPaid = 0;
    let actualShare = 0;

    expenses.forEach((expense) => {

      if (expense.paidBy?.id === member.id) {
        totalPaid += Number(expense.amount || 0);
      }

      expense.participants?.forEach((participant) => {
        if (participant.member?.id === member.id) {
          actualShare += Number(
            participant.shareAmount || 0,
          );
        }
      });
    });

    return {
      ...member,
      totalPaid,
      actualShare,
      balance: totalPaid - actualShare,
    };
  });

  /* =================================================
       SETTLEMENT CALCULATION
       ================================================= */

  const calculateSettlements = () => {
    const creditors = memberBalances
      .filter((member) => member.balance > 0.009)
      .map((member) => ({
        name: member.name,
        amount: member.balance,
      }));

    const debtors = memberBalances
      .filter((member) => member.balance < -0.009)
      .map((member) => ({
        name: member.name,
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

      const amount = Math.min(
        creditor.amount,
        debtor.amount,
      );

      settlements.push({
        from: debtor.name,
        to: creditor.name,
        amount: Number(amount.toFixed(2)),
      });

      creditor.amount = Number(
        (creditor.amount - amount).toFixed(2),
      );

      debtor.amount = Number(
        (debtor.amount - amount).toFixed(2),
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
       FORMAT DATE
       ================================================= */

  const formatDate = (date) => {
    if (!date) {
      return "-";
    }

    return new Date(date).toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      },
    );
  };

  /* =================================================
       LOADING
       ================================================= */

  if (loading) {
    return (
      <div className="overview-page">
        <div className="overview-loading">
          Loading overview...
        </div>
      </div>
    );
  }

  /* =================================================
       PAGE
       ================================================= */

  return (
    <div className="overview-page">

      {/* =================================================
           PAGE HEADER
           ================================================= */}

      <div className="overview-header">

        <span className="overview-label">
          GROUP OVERVIEW
        </span>

        <h1>
          {groupName}
        </h1>

        <p>
          Complete summary of your shared expenses.
        </p>

      </div>


      {/* =================================================
           SUMMARY CARDS
           ================================================= */}

      <div className="overview-summary">

        <div className="overview-summary-card">
          <span>
            TOTAL EXPENSES
          </span>

          <strong>
            ₹{formatAmount(totalExpenses)}
          </strong>
        </div>


        <div className="overview-summary-card">
          <span>
            MEMBERS
          </span>

          <strong>
            {members.length}
          </strong>
        </div>


        <div className="overview-summary-card">
          <span>
            EXPENSES
          </span>

          <strong>
            {expenses.length}
          </strong>
        </div>


        <div className="overview-summary-card">
          <span>
            SETTLEMENTS
          </span>

          <strong>
            {settlements.length}
          </strong>
        </div>

      </div>


      {/* =================================================
           MEMBERS
           ================================================= */}

      <div className="overview-section">

        <span className="overview-section-label">
          MEMBERS
        </span>

        <h2>
          Member Summary
        </h2>


        <div className="overview-member-grid">

          {memberBalances.map((member, index) => {

            const positive = member.balance >= 0;

            return (
              <div
                className="overview-member-card"
                key={member.id}
              >

                <div className="overview-member-top">

                  <div className="overview-member-number">
                    {index + 1}
                  </div>

                  <div>
                    <strong>
                      {member.name}
                    </strong>

                    <span
                      className={
                        positive
                          ? "overview-receive"
                          : "overview-pay"
                      }
                    >
                      {positive
                        ? "Should receive"
                        : "Needs to pay"}
                    </span>
                  </div>

                </div>


                <div className="overview-member-details">

                  <div>
                    <span>
                      TOTAL PAID
                    </span>

                    <strong>
                      ₹{formatAmount(
                        member.totalPaid,
                      )}
                    </strong>
                  </div>


                  <div>
                    <span>
                      ACTUAL SHARE
                    </span>

                    <strong>
                      ₹{formatAmount(
                        member.actualShare,
                      )}
                    </strong>
                  </div>


                  <div>
                    <span>
                      BALANCE
                    </span>

                    <strong
                      className={
                        positive
                          ? "overview-positive"
                          : "overview-negative"
                      }
                    >
                      {positive ? "+" : "-"}₹
                      {formatAmount(
                        Math.abs(member.balance),
                      )}
                    </strong>
                  </div>

                </div>

              </div>
            );
          })}

        </div>

      </div>


      {/* =================================================
           EXPENSES
           ================================================= */}

      <div className="overview-section">

        <span className="overview-section-label">
          EXPENSES
        </span>

        <h2>
          Expense History
        </h2>


        {expenses.length > 0 ? (

          <div className="overview-expense-list">

            {expenses.map((expense) => (

              <div
                className="overview-expense-card"
                key={expense.id}
              >

                <div className="overview-expense-main">

                  <strong>
                    {expense.title}
                  </strong>

                  <span>
                    {expense.category || "General"}
                  </span>

                  <small>
                    {formatDate(expense.date)}
                  </small>

                </div>


                <div className="overview-expense-payer">

                  <span>
                    PAID BY
                  </span>

                  <strong>
                    {expense.paidBy?.name || "-"}
                  </strong>

                </div>


                <div className="overview-expense-amount">
                  ₹{formatAmount(expense.amount)}
                </div>

              </div>

            ))}

          </div>

        ) : (

          <div className="overview-empty">
            No expenses found.
          </div>

        )}

      </div>


      {/* =================================================
           SETTLEMENT SUMMARY
           ================================================= */}

      <div className="overview-section">

        <span className="overview-section-label">
          SETTLEMENT
        </span>

        <h2>
          Settlement Summary
        </h2>


        {settlements.length > 0 ? (

          <div className="overview-settlement-list">

            {settlements.map(
              (settlement, index) => (

                <div
                  className="overview-settlement-card"
                  key={index}
                >

                  <strong>
                    {settlement.from}
                  </strong>

                  <span>
                    →
                  </span>

                  <strong>
                    {settlement.to}
                  </strong>

                  <b>
                    ₹{formatAmount(
                      settlement.amount,
                    )}
                  </b>

                </div>
              ),
            )}

          </div>

        ) : (

          <div className="overview-empty">
            All members are settled.
          </div>

        )}

      </div>


      {/* =================================================
           NAVIGATION
           ================================================= */}

      <div className="overview-navigation">

        <button
          className="overview-nav-button"
          onClick={onBack}
        >
          ← Settlement
        </button>

        <button
          className="overview-nav-button"
          onClick={onHome}
        >
          ← Back to Home
        </button>

      </div>

    </div>
  );
}

export default Overview;