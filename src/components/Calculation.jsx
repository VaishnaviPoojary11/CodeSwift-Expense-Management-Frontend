import { useEffect, useState } from "react";

function Calculation({
  groupId,
  groups,
  onSettlement,
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
      loadCalculationData();
    }
  }, [groupId]);

  const loadCalculationData = async () => {
    try {
      setLoading(true);

      const membersResponse = await fetch(
        `http://localhost:8080/api/members/group/${groupId}`,
      );

      const expensesResponse = await fetch(
        `http://localhost:8080/api/expenses/group/${groupId}`,
      );

      if (!membersResponse.ok || !expensesResponse.ok) {
        throw new Error("Failed to load calculation data");
      }

      const membersData = await membersResponse.json();
      const expensesData = await expensesResponse.json();

      setMembers(membersData);
      setExpenses(expensesData);
    } catch (error) {
      console.error("Error loading calculation data:", error);
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
       INDIVIDUAL BALANCES
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

    /*
     * Positive balance:
     * Member should receive money.
     *
     * Negative balance:
     * Member needs to pay money.
     */

    const balance = totalPaid - actualShare;

    return {
      ...member,
      totalPaid,
      actualShare,
      balance,
    };
  });

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
      <div className="calculation-page">
        <div className="calculation-loading">
          Loading expense calculation...
        </div>
      </div>
    );
  }

  /* =================================================
       PAGE
       ================================================= */

  return (
    <div className="calculation-page">

      {/* =================================================
           PAGE HEADER
           ================================================= */}

      <div className="calculation-header">

        <span className="calculation-label">
          EXPENSE BREAKDOWN
        </span>

        <h1>
          Expense Calculation
        </h1>

        <p>
          See how much each member paid, owes, or should receive.
        </p>

      </div>


      {/* =================================================
           GROUP SUMMARY
           ================================================= */}

      <div className="calculation-group-card">

        <span className="group-label">
          GROUP
        </span>

        <h2>
          {groupName}
        </h2>

        <p>
          {members.length} members
          {" · "}
          {expenses.length} expenses
        </p>

      </div>


      {/* =================================================
           INDIVIDUAL BALANCES
           ================================================= */}

      <div className="balances-section">

        <span className="balances-label">
          BALANCES
        </span>

        <h2>
          Individual Balances
        </h2>

        <div className="balance-grid">

          {balances.map((member, index) => {

            const positive = member.balance >= 0;

            return (
              <div
                className="balance-card"
                key={member.id}
              >

                {/* MEMBER HEADER */}

                <div className="balance-card-top">

                  <div className="member-number">
                    {index + 1}
                  </div>

                  <div className="balance-member-info">

                    <strong>
                      {member.name}
                    </strong>

                    <span
                      className={
                        positive
                          ? "balance-status receive"
                          : "balance-status pay"
                      }
                    >
                      {positive
                        ? "Should receive"
                        : "Needs to pay"}
                    </span>

                  </div>

                  <div
                    className={
                      positive
                        ? "balance-value positive"
                        : "balance-value negative"
                    }
                  >
                    {positive ? "+" : "-"}₹
                    {formatAmount(
                      Math.abs(member.balance),
                    )}
                  </div>

                </div>


                {/* =================================================
                     DIVIDER
                     ================================================= */}

                <div className="balance-divider" />


                {/* =================================================
                     TOTAL PAID + ACTUAL SHARE
                     ================================================= */}

                <div className="balance-details">

                  <div>

                    <span>
                      TOTAL PAID
                    </span>

                    <strong>
                      ₹
                      {formatAmount(
                        member.totalPaid,
                      )}
                    </strong>

                  </div>


                  <div>

                    <span>
                      ACTUAL SHARE
                    </span>

                    <strong>
                      ₹
                      {formatAmount(
                        member.actualShare,
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
           BALANCE LEGEND
           ================================================= */}

      <div className="balance-legend">

        <div className="legend-card">

          <div className="legend-icon positive-icon">
            +
          </div>

          <div>

            <strong>
              Positive balance
            </strong>

            <span>
              Member should receive money.
            </span>

          </div>

        </div>


        <div className="legend-card">

          <div className="legend-icon negative-icon">
            −
          </div>

          <div>

            <strong>
              Negative balance
            </strong>

            <span>
              Member owes money.
            </span>

          </div>

        </div>

      </div>


      {/* =================================================
           SETTLEMENT LOGIC
           ================================================= */}

      <button
        className="settlement-button"
        onClick={onSettlement}
      >
        Settlement Logic

        <span>
          →
        </span>

      </button>


      {/* =================================================
           NAVIGATION
           ================================================= */}

      <div className="calculation-navigation">

        <button
          className="calculation-nav-button"
          onClick={onBack}
        >
          ← Expenses
        </button>

        <button
          className="calculation-nav-button"
          onClick={onHome}
        >
          ← Back to Home
        </button>

      </div>

    </div>
  );
}

export default Calculation;