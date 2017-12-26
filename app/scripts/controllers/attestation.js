(function() {
  'use strict';

  /**
   * @ngdoc function
   * @name ecampusApp.controller:AttestationCtrl
   * @description
   * # AttestationCtrl
   * Controller of the ecampusApp
   */
  angular
    .module('ecampusApp')
    .controller('AttestationCtrl', AttestationCtrl);

  AttestationCtrl.$inject = ['api'];
  function AttestationCtrl(api) {
    /* jshint validthis: true */
    var vm = this;

    vm.errorMessageGroups = '';

    init();

    function init() {
      // init attestation params
      vm.errorMessageYears = '';
      vm.errorMessageAttests = '';
      vm.attestationPeriodId = null;
      // init students results
      vm.getStudentsResult = false;
      vm.attestationResults = null;
      // init groups result
      vm.getGroupsResults = false;
      vm.disciplinesListForGroups = [];
      vm.groupsResult = [];
      // init lecturers result
      vm.getLecturersResults = false;
      vm.lecturersResult = null;
      vm.groupsListForLecturers = [];
      vm.coursesListForLecturers = [];
      vm.disciplinesListForLecturers = [];
      // table sort functionality
      vm.sortOrderStudent = {
        type: null,
        sortReverse: null
      };
      vm.sortOrderLecturer = {
        type: null,
        sortReverse: null
      };

      loadStudyYears();
      loadSemesters();
      loadAttestationPeriods();
    }

    vm.errorLoadGroupsResult = '';
    vm.errorLecturersResult = '';
    vm.errorMessageStudents = '';

    function setPill(newPill) {
      vm.pill = newPill;
      var firstPill = 1;
      if (newPill === firstPill) {
        clearStudentResult();
      }
    }

    vm.isSet = isSet;

    function isSet(pillNum) {
      return vm.pill === pillNum;
    }

    vm.setPill = setPill;

    function setCurrentStudyYear(response) {
      for (var i = 0; i < response.length; i++) {
        var current = response[i];
        if (current.isActual) {
          return current;
        }
      }
    }

    function loadStudyYears() {
      var url = 'Attestation/studyYear';
      var method = 'GET';

      api.execute(method, url)
        .then(function(response) {
          vm.studyYears = response;
          vm.studyYears.selected = setCurrentStudyYear(response);
        },
        function() {
          vm.errorMessageYears = (
            'Не вдалося завантажити список навчальних років'
          );
          vm.studyYears = null;
        });
    }

    function getCurrentStudySemester() {
      var currentStudySemester = 0;
      var currentDate = new Date();
      var month = currentDate.getMonth();
      if (month >= 8 && month <= 11) {
        currentStudySemester = 1;
      } else {
        currentStudySemester = 2;
      }
      return currentStudySemester;
    }

    function setCurrentStudySemester(response) {
      var currentStudySemester = getCurrentStudySemester();
      if (currentStudySemester !== 0) {
        for (var i = 0; i < response.length; i++) {
          var current = response[i];
          if (current.id === currentStudySemester) {
            return current;
          }
        }
      }
    }

    function loadSemesters() {
      vm.studySemesters = [
        { id: 1, name: 'Перший семестр' },
        { id: 2, name: 'Другий семестр' }
      ];
      vm.studySemesters.selected = setCurrentStudySemester(
        vm.studySemesters
      );
    }

    // 1 period - (7 - 9) study year week
    // 2 period - (13 - 15) study year week
    function getCurrentStudyAttestationPeriod() {
      Date.prototype.getWeek = function() {
        var date = new Date(this.getTime());
        date.setHours(0, 0, 0, 0);
        // Thursday in current week decides the year.
        date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
        // January 4 is always in week 1.
        var week1 = new Date(date.getFullYear(), 0, 4);
        // Adjust to Thursday in week 1 and
        // count number of weeks from date to week1.
        return (
          1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 -
            3 + (week1.getDay() + 6) % 7) / 7)
        );
      };

      var currentStudyAttestationPeriod = 'не визначено';
      var currentDate = new Date();
      var week = currentDate.getWeek();

      if ((week >= 42 && week <= 44) || (week >= 12 && week <= 14)) {
        currentStudyAttestationPeriod = 'Атестація №1';
      } else if ((week >= 48 && week <= 50) || (week >= 18 && week <= 20)) {
        currentStudyAttestationPeriod = 'Атестація №2';
      }
      return currentStudyAttestationPeriod;
    }

    function setCurrentStudyAttestationPeriod(response) {
      var currentStudyAttestationPeriod = getCurrentStudyAttestationPeriod();
      if (currentStudyAttestationPeriod !== 0) {
        for (var i = 0; i < response.length; i++) {
          var current = response[i];
          if (current.name === currentStudyAttestationPeriod) {
            return current;
          }
        }
      }
    }

    function loadAttestationPeriods() {
      var url = 'Attestation';
      var method = 'GET';

      api.execute(method, url)
        .then(function(response) {
          vm.studyAttestationPeriod = response;
          vm.studyAttestationPeriod.selected = (
            setCurrentStudyAttestationPeriod(response)
          );
        },
        function() {
          vm.errorMessageAttests = (
            'Не вдалося завантажити список атестацій'
          );
          vm.attestations = null;
        });
    }

    vm.getDisciplineName = getDisciplineName;

    function getDisciplineName(name) {
      var result = name.split(',');
      return result[0];
    }

    function sortRuleForLecturersResult(a, b) {
      // sort response in this order:
      // 1 - by course 2 - by study group name
      // 3 - by discipline name
      var course1 = +(a.course);
      var course2 = +(b.course);
      var group1 = a.studyGroup.name;
      var group2 = b.studyGroup.name;
      var disc1 = a.rnpRow.name;
      var disc2 = b.rnpRow.name;

      return (
        course1 - course2 || group1.localeCompare(group2) ||
        disc1.localeCompare(disc2)
      );
    }

    function generateUrlForAttestPeriod(year, semester, attestNum) {
      return (
        'Attestation/period?dcStudingYearId=' + year +
        '&semesterYear=' + semester + '&dcLoadId=' + attestNum
      );
    }

    vm.checkAttestationAvailability = function() {
      var yearId = vm.studyYears.selected.id;
      var semesterId = vm.studySemesters.selected.id;
      var periodId = vm.studyAttestationPeriod.selected.id;

      checkAttestationAvailability(yearId, semesterId, periodId);
    };

    function checkAttestationAvailability(
      dcStudingYearId,
      semesterYear,
      dcLoadId) {
      var url = generateUrlForAttestPeriod(
        dcStudingYearId,
        semesterYear,
        dcLoadId
      );
      var method = 'GET';
      vm.errorAttestationPeriod = (
        'Немає даних про атестацію для таких параметрів!'
      );

      api.execute(method, url)
        .then(function(response) {
          if (response) {
            vm.attestationPeriodId = +response;
            if (response.data !== undefined) {
              var msg = 'No attestation period with this params';
              if (response.data.message === msg) {
                vm.attestationPeriodId = -1;
              }
            }
          } else {
            vm.attestationPeriodId = -1;
          }
        },
        function() {
          vm.attestationPeriodId = -1;
        });
    }

    vm.loadGroups = function(namePattern, year) {
      if (namePattern.length > 1) {
        var url = 'Account/group/find/' + namePattern + '/year/' + year;
        // url + namePattern (2 first symbol of group)
        api.execute('GET', url)
          .then(function(response) {
            vm.errorMessageGroups = '';
            vm.Groups = response;
          },
          function() {
            vm.errorMessageGroups = 'Не вдалося завантажити список груп';
            vm.Groups = null;
          });
      } else {
        vm.errorMessageGroups = (
          'Введіть більше 2-х символів для пошуку групи'
        );
      }
    };

    vm.loadGroupsResult = function(rtStudyGroupId, cAttestationPeriodId) {
      var url = (
        'Attestation/group/' + rtStudyGroupId + '/period/' +
        cAttestationPeriodId + '/result'
      );
      api.execute('GET', url)
        .then(function(response) {
          vm.errorLoadGroupsResult = '';
          vm.getGroupsResults = true;
        },
        function() {
          vm.errorLoadGroupsResult = (
            'Не вдалося завантажити результати для даної групи'
          );
          vm.groupsResult = null;
        });
    };

    vm.loadLecturers = function(namePattern) {
      if (namePattern.length > 2) {
        var url = 'Account/employee/find/' + namePattern;
        // url + namePattern (3 first symbol of group)
        api.execute('GET', url)
          .then(function(response) {
            vm.errorMessageLecturers = '';
            vm.lecturersList = response;
          },
          function() {
            vm.errorMessageLecturers = 'Не вдалося завантажити список груп';
            vm.lecturersList = null;
          });
      } else {
        vm.errorMessageLecturers = (
          'Введіть більше 3-х символів для пошуку викладача'
        );
      }
    };

    vm.createStringForSelect = createStringForSelect;

    function createStringForSelect(obj) {
      var COURSE = 'курс';
      var GROUP = 'група';
      var SPACE = ' ';
      var DASH = ' - ';
      if (obj) {
        return (obj.course.toString() + SPACE +
          COURSE + DASH +
          SPACE + GROUP + SPACE +
          obj.studyGroup + DASH +
          obj.disciplineName
        );
      }
    }

    function sortRuleAttestationsLectRes(a, b) {
      var name1 = a.studentName;
      var name2 = b.studentName;

      return name1.localeCompare(name2);
    }

    function transformAttestationsForLecturerResults(array) {
      var result = [];
      var obj = {};

      array.forEach(function(item) {
        obj = {
          studentName: item.student.name,
          attestationName: item.attestation.name
        };
        result.push(obj);
      });

      return result.sort(sortRuleAttestationsLectRes);
    }

    function transformLecturersAttestations(array) {
      var result = [];
      var obj = {};

      array.forEach(function(item) {
        obj = {
          course: item.course,
          studyGroup: item.studyGroup.name,
          disciplineName: getDisciplineName(item.rnpRow.name),
          attestations: transformAttestationsForLecturerResults(
            item.attestations
          )
        };
        result.push(obj);
      });

      return result;
    }

    vm.loadLecturersResult = function(eEmployees1Id, cAttestationPeriodId) {
      var url = (
        'Attestation/lecturer/' + eEmployees1Id + '/period/' +
        cAttestationPeriodId + '/result'
      );
      api.execute('GET', url)
        .then(function(response) {
          if (response.length === 0) {
            vm.lecturersResult = [];
            vm.errorLecturersResult = (
              'Немає даних про атестацію для вказаного викладача!'
            );
            vm.getLecturersResults = false;
          } else {
            vm.getLecturersResults = true;
            var sortedResponse = response.sort(sortRuleForLecturersResult);
            vm.lecturersResult = transformLecturersAttestations(
              sortedResponse
            );
            vm.lecturerResult = null;
          }
        },
        function() {
          vm.errorLecturersResult = (
            'Не вдалося завантажити результати для даного викладача'
          );
          vm.lecturersResult = null;
          vm.getLecturersResults = false;
        });
    };

    vm.loadStudents = function(namePattern) {
      if (namePattern.length > 2) {
        var url = 'Account/student/find/' + namePattern;
        // url + namePattern (3 first symbol of group)
        api.execute('GET', url)
          .then(function(response) {
            vm.errorMessageStudents = '';
            vm.students = response;
          },
          function() {
            vm.errorMessageStudents = 'Не вдалося завантажити список груп';
            vm.students = null;
          });
      } else {
        vm.errorMessageStudents = (
          'Введіть більше 3-х символів для пошуку студента'
        );
      }
    };

    function transformStudentsAttestations(array) {
      var result = [];
      var obj = {};

      array.forEach(function(item) {
        obj = {
          attestation: item.attestation.name,
          lecturer: item.lecturer.name,
          disciplineName: getDisciplineName(item.rnpRow.name)
        };
        result.push(obj);
      });

      return result;
    }

    function clearStudentResult() {
      vm.itemStudent = null;
      vm.getStudentsResult = false;
      vm.attestationResults = null;
    }

    vm.clearStudentResult = clearStudentResult;

    function loadStudentsResult(sPersonalityId, cAttestationPeriodId) {
      var url = (
        'Attestation/student/' + sPersonalityId + '/period/' +
        cAttestationPeriodId + '/result'
      );
      var method = 'GET';
      api.execute(method, url)
        .then(function(response) {
          vm.getStudentsResult = true;
          // check if response array not empty
          if (response.length !== 0) {
            vm.attestationResults = transformStudentsAttestations(
              response[0].attestations
            );
          } else {
            vm.attestationResults = [];
          }
          createFileNameForStudent();
        },
        function() {
          vm.getStudentsResult = true;
          vm.attestationResults = null;
        });
    }

    vm.loadStudentsResult = loadStudentsResult;

    function createFileNameForStudent() {
      var student = vm.itemStudent;
      var FILE_TITLE = 'Атестація';
      var DASH = '-';
      vm.fileNameLecturer = (
        FILE_TITLE + DASH +
        student.group + DASH + student.fullName
      );
      // add global window var for onclick function
      window.fileNameLecturer = vm.fileNameLecturer;
    }

    // sort data in table functions

    function changeSortOrder(orderBy) {
      orderBy.sortReverse = !orderBy.sortReverse;
    }

    function setSortOrderType(orderBy, newOrderType) {
      orderBy.type = newOrderType;
      changeSortOrder(orderBy);
    }

    function isAscendingSort(orderBy, orderType) {
      return orderBy.type === orderType && orderBy.sortReverse;
    }

    function isDescendingSort(orderBy, orderType) {
      return orderBy.type === orderType && !orderBy.sortReverse;
    }

    vm.setSortOrderType = setSortOrderType;
    vm.isAscendingSort = isAscendingSort;
    vm.isDescendingSort = isDescendingSort;

    function onAttestationPeriodSelect() {
      vm.checkAttestationAvailability();
    }

    vm.onAttestationPeriodSelect = onAttestationPeriodSelect;

    function onStudentSelect() {
      vm.loadStudentsResult(vm.itemStudent.id, vm.attestationPeriodId);
    }

    vm.onStudentSelect = onStudentSelect;

    function showStudentResult() {
      if (vm.attestationResults !== null) {
        return vm.attestationResults.length !== 0;
      }
    }

    vm.showStudentResult = showStudentResult;

    function showErrorLoadStudentResult() {
      if (vm.attestationResults !== null) {
        if (vm.getStudentsResult) {
          return vm.attestationResults.length === 0;
        } else {
          return false;
        }
      } else {
        return false;
      }
    }

    vm.showErrorLoadStudentResult = showErrorLoadStudentResult;

    function onLecturerSelect() {
      vm.loadLecturersResult(vm.itemLecturers.id, vm.attestationPeriodId);
    }

    vm.onLecturerSelect = onLecturerSelect;

    function showLecturerResult() {
      if (vm.lecturersResult !== null) {
        return vm.lecturersResult.length !== 0;
      }
    }

    vm.showLecturerResult = showLecturerResult;

    function createFileNameForLecturer() {
      vm.fileNameLecturer = createStringForSelect(vm.lecturerResult);
      // add global window var for onclick function
      window.fileNameLecturer = vm.fileNameLecturer;
    }

    function onLecturerResultSelect() {
      createFileNameForLecturer();
    }

    vm.onLecturerResultSelect = onLecturerResultSelect;

    function showResult() {
      if (vm.lecturerResult !== null) {
        return vm.lecturerResult.length !== 0;
      }
    }

    vm.showResult = showResult;
  }
})();
