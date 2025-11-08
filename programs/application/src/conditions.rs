use crate::{ states };

pub fn check_win_condition(grid: states::Grid) -> bool {
  let board = &grid.board;

  if (board[0][0] == board[1][1] && board[1][1] == board[2][2] ||
    board[0][2] == board[1][1] && board[1][1] == board[2][0]) && board[1][1].is_some()
  {
    return true;
  }

  for i in 0..3 {
    if board[i][0] == board[i][1] && board[i][1] == board[i][2] && board[i][0].is_some() ||
      board[0][i] == board[1][i] && board[1][i] == board[2][i] && board[0][i].is_some()
    {
      return true;
    }
  }

  false
}

pub fn check_draw_condition(grid: states::Grid) -> bool {
  let board = &grid.board;

  if board.iter().all(|row| row.iter().all(|cell| cell.is_some())) {
    return true;
  }

  false
}