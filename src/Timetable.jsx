import React, { useState, useEffect } from "react";
import "./App.css";

const timeToDate = (timeStr) => {
  const [h, m] = timeStr.split(":").map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
};

const Timetable = () => {
  const [timetable, setTimetable] = useState({});
  const [days, setDays] = useState([]);
  const [now, setNow] = useState(new Date());
  const [errorMsg, setErrorMsg] = useState("");

  // ✅ Load timetable from localStorage (if exists)
  useEffect(() => {
    const saved = localStorage.getItem("timetable");
    if (saved) {
      const parsed = JSON.parse(saved);
      setTimetable(parsed);
      setDays(Object.keys(parsed));
    }
  }, []);

  // ✅ Try updating from backend, if online
  useEffect(() => {
    fetch("https://timetable-backend-254424826421.us-central1.run.app/")
      .then((res) => res.json())
      .then((data) => {
        setTimetable(data);
        setDays(Object.keys(data));
        localStorage.setItem("timetable", JSON.stringify(data)); // save for offline
      })
      .catch((err) => {
        console.warn("Offline: using cached timetable");
        setErrorMsg("Offline mode");
      });
  }, []);

  const today = new Date();
  const todayIndex = today.getDay() - 1; // Monday=0
  const [currentDayIndex, setCurrentDayIndex] = useState(
    todayIndex >= 0 && todayIndex < 5 ? todayIndex : 0
  );

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  if (!days.length) return <div>Loading timetable...</div>;

  const handlePrevDay = () => {
    setCurrentDayIndex((prev) => (prev - 1 + days.length) % days.length);
  };

  const handleNextDay = () => {
    setCurrentDayIndex((prev) => (prev + 1) % days.length);
  };

  const currentDay = days[currentDayIndex];
  const schedule = timetable[currentDay];

  return (
    <div className="timetable-container">
      <div className="timetable-header">
        <button onClick={handlePrevDay} style={{ outline: "none" }}>
          &lt;
        </button>
        <h2 style={{ color: "#e2dcdcff" }}>{currentDay}</h2>
        <button onClick={handleNextDay} style={{ outline: "none" }}>
          &gt;
        </button>
      </div>

      <div className="schedule">
        {schedule.map((item, index) => {
          const start = timeToDate(item.start);
          const end = timeToDate(item.end);

          // Only mark "Now" if it's today’s schedule
          const isToday = currentDayIndex === todayIndex;
          const isNow = isToday && now >= start && now < end;

          let nextItem = null;
          if (isToday && !isNow) {
            nextItem = schedule.find((p) => timeToDate(p.start) > now);
          }

          const formatTime = (ms) => {
            const totalSeconds = Math.floor(ms / 1000);
            const hrs = Math.floor(totalSeconds / 3600);
            const mins = Math.floor((totalSeconds % 3600) / 60);
            const secs = totalSeconds % 60;
            return `${hrs > 0 ? hrs + ":" : ""}${String(mins).padStart(
              2,
              "0"
            )}:${String(secs).padStart(2, "0")}`;
          };

          let countdownText = "";
          if (isToday && !isNow && nextItem && nextItem.start === item.start) {
            const diff = timeToDate(nextItem.start) - now;
            if (diff > 0) {
              countdownText = `- ${formatTime(diff)}`;
            }
          }

          return (
            <div
              key={index}
              className="card"
              style={{
                backgroundColor: item.color || "#607d8b",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <div className="time">
                  {item.start} - {item.end}
                </div>
                <div
                  className="subject"
                  style={{
                    maxWidth: isNow || countdownText ? "230px" : "unset",
                  }}
                >
                  {item.subject}
                </div>
              </div>

              {isNow && (
                <div
                  className="now-time"
                  style={{
                    fontWeight: "bold",
                    backgroundColor: "#F3F2EC",
                    padding: "0 10px",
                    borderRadius: "10px",
                    color: item.color,
                  }}
                >
                  Now
                </div>
              )}

              {!isNow && countdownText && (
                <div
                  className="next-time"
                  style={{
                    maxWidth: "130px",
                    fontWeight: "bold",
                    backgroundColor: "#F3F2EC",
                    padding: "0 6px",
                    borderRadius: "10px",
                    color: item.color,
                  }}
                >
                  {countdownText}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Timetable;
