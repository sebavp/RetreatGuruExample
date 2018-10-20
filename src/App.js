import React from 'react';
import dateFns from 'date-fns';
import axios from 'axios';
import moment from 'moment';

import './App.css';


const selectedRoom = 'Room 5';

class Calendar extends React.Component {
  state = {
    currentMonth: new Date('08/01/2025'),
    selectedDate: new Date(),
    registrations: [],
    occupancy: {}
  };

  componentDidMount = async () => {
    const { REACT_APP_API_URL, REACT_APP_API_TOKEN } = process.env;
    const registrations = await axios.get(`${REACT_APP_API_URL}/registrations?token=${REACT_APP_API_TOKEN}`);
    this.setState({ registrations: registrations.data });
  }

  componentDidUpdate = (_, prevState) => {
    const { registrations, currentMonth } = this.state;
    if( registrations !== prevState.registrations || currentMonth !== prevState.currentMonth){
      this.occupancy();
    }
  }

  occupancyByDay = day => {
    const occupancy = this.state.registrations.find(
      registration =>
        day.isSameOrAfter(registration.start_date) &&
        day.isBefore(registration.end_date)

    );

    return occupancy || false;
  }

  occupancy = () => {
    const { currentMonth } = this.state;
    let occupancy = {};
    for (let day = moment(dateFns.startOfMonth(currentMonth)); day.isSameOrBefore(dateFns.endOfMonth(currentMonth)); day = day.add(1, 'days')) {
      occupancy[day.date()] = this.occupancyByDay(day);
    }
    this.setState({ occupancy });
  }

  renderHeader() {
    const dateFormat = 'MMMM YYYY';

    return (
      <div className='header row flex-middle'>
        <div className='col col-start'>
          <div className='icon' onClick={this.prevMonth}>
            chevron_left
          </div>
        </div>
        <div className='col col-center'>
          <span>{dateFns.format(this.state.currentMonth, dateFormat)}</span>
        </div>
        <div className='col col-end' onClick={this.nextMonth}>
          <div className='icon'>chevron_right</div>
        </div>
      </div>
    );
  }

  renderDays() {
    const dateFormat = 'dddd';
    const days = [];

    let startDate = dateFns.startOfWeek(this.state.currentMonth);

    for (let i = 0; i < 7; i++) {
      days.push(
        <div className='col col-center' key={i}>
          {dateFns.format(dateFns.addDays(startDate, i), dateFormat)}
        </div>
      );
    }

    return <div className='days row'>{days}</div>;
  }

  renderCells() {
    const { currentMonth, selectedDate, occupancy } = this.state;
    const monthStart = dateFns.startOfMonth(currentMonth);
    const monthEnd = dateFns.endOfMonth(monthStart);
    const startDate = dateFns.startOfWeek(monthStart);
    const endDate = dateFns.endOfWeek(monthEnd);

    const dateFormat = 'D';
    const rows = [];

    let days = [];
    let day = startDate;
    let formattedDate = '';

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        formattedDate = dateFns.format(day, dateFormat);
        const cloneDay = day;
        const occupancyDay = occupancy[moment(day).date()];
        const occupied = occupancyDay && occupancyDay.room === selectedRoom && (!this.state.onlyPending || occupancyDay.status === 'pending');
        days.push(
          <div
            className={`col cell ${
              !dateFns.isSameMonth(day, monthStart)
                ? 'disabled'
                : dateFns.isSameDay(day, selectedDate) ? 'selected' : ''
            } ${ occupied ? 'occupied' : ''}`}
            title={occupied ? occupancyDay.full_name : null}
            key={day}
          >
            <span className='number'>{formattedDate}</span>
            <span className='bg'>{formattedDate}</span>
          </div>
        );
        day = dateFns.addDays(day, 1);
      }
      rows.push(
        <div className='row' key={day}>
          {days}
        </div>
      );
      days = [];
    }
    return <div className='body'>{rows}</div>;
  }

  onDateClick = day => {
    this.setState({
      selectedDate: day
    });
  };

  nextMonth = () => {
    this.setState({
      currentMonth: dateFns.addMonths(this.state.currentMonth, 1)
    });
  };

  prevMonth = () => {
    this.setState({
      currentMonth: dateFns.subMonths(this.state.currentMonth, 1)
    });
  };

  render() {
    const available = Object.values(this.state.occupancy).filter(occupied => !(occupied && occupied.room === selectedRoom)).length; 
    return (
      <div className='calendar'>
        <input
          type='checkbox'
          value={this.state.onlyPending}
          onChange={() => this.setState({ onlyPending: !this.state.onlyPending })}
        />
        <label>Show only pending</label>
        {this.renderHeader()}
        {this.renderDays()}
        {this.renderCells()}
        <p>{available} Available nights</p>
      </div>
    );
  }
}

export default Calendar;