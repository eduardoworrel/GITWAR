import { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';

interface CalendarModalProps {
  onClose: () => void;
}

// Wider spacing - 30px per minute = 1800px per hour
const MINUTE_WIDTH = 30;
const HOUR_WIDTH = MINUTE_WIDTH * 60;
const TOTAL_WIDTH = HOUR_WIDTH * 24;
const ROW_LABEL_WIDTH = 140; // Must match CSS margin-left on cal-event-row

export function CalendarModal({ onClose }: CalendarModalProps) {
  const { t } = useTranslation();
  const [currentMinute, setCurrentMinute] = useState(() => {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;
  });
  const [isFollowing, setIsFollowing] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setCurrentMinute(now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Scroll to current time on mount
  useEffect(() => {
    if (scrollRef.current) {
      const scrollPos = ROW_LABEL_WIDTH + (currentMinute * MINUTE_WIDTH) - (scrollRef.current.clientWidth / 2);
      scrollRef.current.scrollLeft = Math.max(0, scrollPos);
    }
  }, []);

  // Detect when user scrolls away from current time
  useEffect(() => {
    const handleScroll = () => {
      if (!scrollRef.current) return;
      const currentScrollPos = scrollRef.current.scrollLeft;
      const expectedPos = ROW_LABEL_WIDTH + (currentMinute * MINUTE_WIDTH) - (scrollRef.current.clientWidth / 2);
      const diff = Math.abs(currentScrollPos - expectedPos);
      // If scrolled more than 200px away, show "Now" button
      setIsFollowing(diff < 200);
    };

    const scrollEl = scrollRef.current;
    if (scrollEl) {
      scrollEl.addEventListener('scroll', handleScroll);
      return () => scrollEl.removeEventListener('scroll', handleScroll);
    }
  }, [currentMinute]);

  const scrollToNow = () => {
    if (scrollRef.current) {
      const scrollPos = ROW_LABEL_WIDTH + (currentMinute * MINUTE_WIDTH) - (scrollRef.current.clientWidth / 2);
      scrollRef.current.scrollTo({ left: Math.max(0, scrollPos), behavior: 'smooth' });
      setIsFollowing(true);
    }
  };

  const formatTime = (minute: number) => {
    const h = Math.floor(minute / 60);
    const m = Math.floor(minute % 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  const today = new Date();
  const hours = Array.from({ length: 24 }, (_, i) => i);

  // Only show cards for less frequent events
  const unexplainedMinutes = Array.from({ length: 24 }, (_, i) => i * 60);
  const bossMinute = 18 * 60;

  return (
    <div className="cal-overlay" onClick={onClose}>
      <div className="cal-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="cal-header">
          <div className="cal-title">
            <span className="cal-day">{today.getDate()}</span>
            <div className="cal-info">
              <span className="cal-weekday">{today.toLocaleDateString('pt-BR', { weekday: 'long' })}</span>
              <span className="cal-month">{today.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</span>
            </div>
          </div>
          <div className="cal-current">{formatTime(currentMinute)}</div>
          <button className="cal-close" onClick={onClose}>×</button>
        </div>

        {/* Legend */}
        <div className="cal-legend">
          <div className="cal-legend-item">
            <div className="cal-legend-bar cal-bar-bug" />
            <span>{t('calendar.bugSwarm')}</span>
            <span className="cal-legend-freq">{t('calendar.every1min')}</span>
          </div>
          <div className="cal-legend-item">
            <span className="cal-legend-icon">🤖</span>
            <span>{t('calendar.intermediate')}</span>
            <span className="cal-legend-freq">{t('calendar.every5min')}</span>
          </div>
          <div className="cal-legend-item">
            <span className="cal-legend-icon">🔮</span>
            <span>{t('calendar.unexplainedBug')}</span>
            <span className="cal-legend-freq">{t('calendar.every1hour')}</span>
          </div>
          <div className="cal-legend-item">
            <span className="cal-legend-icon">👹</span>
            <span>{t('calendar.boss')}</span>
            <span className="cal-legend-freq">{t('calendar.at18h')}</span>
          </div>
        </div>

        {/* Timeline */}
        <div className="cal-scroll" ref={scrollRef}>
          <div className="cal-timeline" style={{ width: TOTAL_WIDTH + 300 }}>
            {/* Hour grid lines */}
            {hours.map((h) => (
              <div key={h} className="cal-grid-line" style={{ left: ROW_LABEL_WIDTH + h * HOUR_WIDTH }} />
            ))}

            {/* Hour labels - sticky top */}
            <div className="cal-hours-bar">
              {hours.map((h) => (
                <div key={h} className="cal-hour-label" style={{ left: ROW_LABEL_WIDTH + h * HOUR_WIDTH }}>
                  {h.toString().padStart(2, '0')}:00
                </div>
              ))}
            </div>

            {/* Bug Swarm - continuous bar */}
            <div className="cal-event-row">
              <div className="cal-row-label">
                <span>🐛</span>
                <span>{t('calendar.bugSwarm')}</span>
              </div>
              <div className="cal-continuous-bar cal-bar-bug">
                <span className="cal-bar-text">{t('calendar.continuousEvent')}</span>
              </div>
            </div>

            {/* Intermediate - cards every 5 min */}
            <div className="cal-event-row cal-event-row-cards">
              <div className="cal-row-label">
                <span>🤖</span>
                <span>{t('calendar.intermediate')}</span>
              </div>
              <div className="cal-cards-row">
                {Array.from({ length: 288 }, (_, i) => i * 5).map((minute) => (
                  <div
                    key={minute}
                    className="cal-card cal-card-inter"
                    style={{ left: minute * MINUTE_WIDTH }}
                  >
                    <span className="cal-card-icon">🤖</span>
                    <div className="cal-card-info">
                      <span className="cal-card-time">{formatTime(minute)}</span>
                      <span className="cal-card-name">{t('calendar.intermediate')}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Unexplained Bug - full cards */}
            <div className="cal-event-row cal-event-row-cards">
              <div className="cal-row-label">
                <span>🔮</span>
                <span>{t('calendar.unexplainedBug')}</span>
              </div>
              <div className="cal-cards-row">
                {unexplainedMinutes.map((minute) => (
                  <div
                    key={minute}
                    className="cal-card cal-card-unex"
                    style={{ left: minute * MINUTE_WIDTH }}
                  >
                    <span className="cal-card-icon">🔮</span>
                    <div className="cal-card-info">
                      <span className="cal-card-time">{formatTime(minute)}</span>
                      <span className="cal-card-name">{t('calendar.unexplainedBug')}</span>
                      <span className="cal-card-desc">{t('calendar.highHpBoss')}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Boss - special card */}
            <div className="cal-event-row cal-event-row-cards">
              <div className="cal-row-label">
                <span>👹</span>
                <span>{t('calendar.boss')}</span>
              </div>
              <div className="cal-cards-row">
                <div
                  className="cal-card cal-card-boss"
                  style={{ left: bossMinute * MINUTE_WIDTH }}
                >
                  <span className="cal-card-icon cal-boss-icon">👹</span>
                  <div className="cal-card-info">
                    <span className="cal-card-time">{t('calendar.at18h')}</span>
                    <span className="cal-card-name">{t('calendar.boss')}</span>
                    <span className="cal-card-desc">{t('calendar.fridayDeploy')}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Current time indicator */}
            <div className="cal-now-indicator" style={{ left: ROW_LABEL_WIDTH + currentMinute * MINUTE_WIDTH }}>
              <div className="cal-now-badge">{formatTime(currentMinute)}</div>
              <div className="cal-now-line" />
            </div>
          </div>
        </div>

        <div className="cal-footer">
          {t('calendar.dragToNavigate')}
        </div>

        {/* "Now" button - appears when scrolled away */}
        {!isFollowing && (
          <button className="cal-now-btn" onClick={scrollToNow}>
            {t('calendar.now', 'Agora')}
          </button>
        )}
      </div>
    </div>
  );
}
