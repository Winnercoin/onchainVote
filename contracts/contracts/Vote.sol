// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title Vote
 * @notice Create polls and vote on-chain. One vote per address per poll.
 */
contract Vote {
    event PollCreated(address indexed creator, uint256 indexed pollId, string question);
    event Voted(address indexed voter, uint256 indexed pollId, uint256 optionIndex);

    struct Poll {
        uint256 id;
        address creator;
        string question;
        string[] options;
        uint256[] voteCounts;
        uint256 createdAt;
        uint256 totalVotes;
    }

    Poll[] public polls;
    mapping(uint256 => mapping(address => bool)) public hasVoted;
    mapping(uint256 => mapping(address => uint256)) public voterChoice;
    uint256 public totalPolls;

    function createPoll(string calldata question, string[] calldata options) external returns (uint256) {
        require(bytes(question).length > 0, "Question required");
        require(options.length >= 2 && options.length <= 6, "2-6 options required");

        uint256 pollId = polls.length;
        uint256[] memory counts = new uint256[](options.length);
        polls.push(Poll({
            id: pollId,
            creator: msg.sender,
            question: question,
            options: options,
            voteCounts: counts,
            createdAt: block.timestamp,
            totalVotes: 0
        }));
        totalPolls++;
        emit PollCreated(msg.sender, pollId, question);
        return pollId;
    }

    function vote(uint256 pollId, uint256 optionIndex) external {
        require(pollId < polls.length, "Poll not found");
        require(!hasVoted[pollId][msg.sender], "Already voted");
        require(optionIndex < polls[pollId].options.length, "Invalid option");

        hasVoted[pollId][msg.sender] = true;
        voterChoice[pollId][msg.sender] = optionIndex;
        polls[pollId].voteCounts[optionIndex]++;
        polls[pollId].totalVotes++;
        emit Voted(msg.sender, pollId, optionIndex);
    }

    function getPoll(uint256 pollId) external view returns (Poll memory) {
        require(pollId < polls.length, "Poll not found");
        return polls[pollId];
    }

    function getRecentPolls(uint256 count) external view returns (Poll[] memory) {
        uint256 len = polls.length;
        uint256 start = len > count ? len - count : 0;
        Poll[] memory result = new Poll[](len - start);
        for (uint256 i = 0; i < result.length; i++) result[i] = polls[start + i];
        return result;
    }
}
